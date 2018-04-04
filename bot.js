var Discord = require('discord.io');
var auth = require('./auth.json');
var tts = require('google-tts-api');
var request = require('request');
var fs = require('fs');

function isVoiceChannel(channel_id) {
  if ( !channel_id ) return false;
  for (var server in bot.servers) {
    for (var channel in bot.servers[server].channels) {
      var chan = bot.servers[server].channels[channel];
      if ( chan.type == 2 ) {
        if ( chan.id.toString() == channel_id.toString() ) {
          console.log(chan);
          return true;
        }
      }
    }
  }
  return false;
};

function stripRepeatingChars( message, maxChars )
{
  var a = message.split('');
  var leaveOneRemaining = true;
  var thresholdToStartStriping = maxChars;

  var lastletter = '';
  var stripLength = leaveOneRemaining?0:1;
  for (var i = a.length; i > 0; i--) {
    var letter = a[i - 1];

    if (lastletter == letter) {
        stripLength++;
    } else if (stripLength > thresholdToStartStriping) {
        a.splice(i, stripLength);
        stripLength = leaveOneRemaining?0:1;;
    } else {
        stripLength = leaveOneRemaining?0:1;;
    }
    lastletter = letter;
  }
  
  return a.join('');
};

function isExcluded(message) {
  return message.startsWith('```');
};

function isUserInVoiceChannel(user_id) {
  return getUserVoiceChannel(user_id) != null;
};

function getUserVoiceChannel(user_id) {
  for ( var server in bot.servers ) {
    for ( var channel in bot.servers[server].channels) {
      var chan = bot.servers[server].channels[channel];
      if ( chan.type == 2 ) {
        for ( var member in chan.members ) {
          var u = chan.members[member];
          if ( u.user_id == user_id ) return channel;
        }
      }
    }
  }
  
  return null;
};

function sendMessage(channel_id, message) {
  
  bot.simulateTyping(channel_id, function() {
    bot.sendMessage({
        to: channel_id,
        message: message
    });
  });
};

function getDiscordUserIdFromMessage(message) {
  return message.replace(/<@!(\d{12,19})>/g, function(a,b){
    return b;
  });
};

function awesomeHacks(message) {
  return message.replace("(Y)", "thumbs up").replace("(N)", "thumbs down");
};

function getNickFromUserId( channel_id, user_id ) {
  
  if ( !bot.channels[channel_id] ) 
    console.log("getNickFromUserId(): Cant find channel " + channel_id + ", " + user_id); 
  else if ( !bot.servers[bot.channels[channel_id].guild_id] ) 
    console.log("getNickFromUserId(): Cant find server " + bot.channels[channel_id].guild_id + " for channel " + channel_id);
  else if ( !bot.servers[bot.channels[channel_id].guild_id].members[user_id] )
    console.log("getNickFromUserId(): Cant find member on the server for " + bot.channels[channel_id].guild_id + ", " + user_id);
  else 
    return bot.servers[bot.channels[channel_id].guild_id].members[user_id].nick;        
  return null;

};

function convertCamelCaseNicksToEnglish( nick_name ) {
  return nick_name.replace(/([a-z])([A-Z])/g, function(a,b,c){
    return b + " " + c;
  });
};

function resolveDiscordSnowflakes(channel_id, message) {
	return message.replace(/<@&(\d*)>|<@!(\d*)>|<@(\d*)>|<#(\d*)>/g, function(match, RID, NID, UID, CID) {
		var k, i;
		if (UID || CID) {
			if (bot.users[UID]) return convertCamelCaseNicksToEnglish(bot.users[UID].username);
			if (bot.channels[CID]) return convertCamelCaseNicksToEnglish(bot.channels[CID].name);
		}
		if (RID || NID) {
			if ( bot.servers[bot.channels[channel_id].guild_id].roles[RID])
				return convertCamelCaseNicksToEnglish(bot.servers[bot.channels[channel_id].guild_id].roles[RID].name);
			if ( bot.servers[bot.channels[channel_id].guild_id].members[NID]) 
				return convertCamelCaseNicksToEnglish(bot.servers[bot.channels[channel_id].guild_id].members[NID].nick);
		}
	});
};

function stripUrls(message) {
  return message.replace(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/g, "");
};

var world = {
  NEGLECT_TIMEOUT_IN_MS: 30 * 60 * 1000, // 30 mins

  servers: {},
  
  addServer: function(serverObj) {
    this.servers[serverObj.id] = new Server(serverObj, serverObj.id);
  },
  
  removeServer: function(server_id) {
    this.servers[server_id] = null;
  },
  
  resetNeglectTimeouts: function() {
    for ( var server in this.servers ) {
      server.resetNeglectTimeout();
    }
  },
  
  permitAllMasters: function() {
    for ( var server in this.servers ) {
      if ( server.isBound() )
        server.setMaster(server.bound_to, server.bound_to_username);
    } 
  },
    
  unpermitAll: function() {
    for ( var server in this.servers ) {
      server.release();
    } 
  }, 
  
  getServerFromChannel: function( channel_id ) {
    var chan = bot.channels[channel_id];
    if ( chan ) {
      var server = this.servers[bot.channels[channel_id].guild_id];
      return server;
    }
    else 
      return null;
  },
  
  checkMastersVoiceChannels: function( user_id ) {
    var voiceChan = getUserVoiceChannel(user_id);
    for ( var server in this.servers ) {
      var s = this.servers[server];
      if ( s.bound_to == user_id ) {
        if ( voiceChan != s.current_voice_channel_id )
          s.leaveVoiceChannel();
      }
    }
  },
  
  initServers: function() { 
    for ( var server in bot.servers ) {
      if ( !this.servers[server] )
        this.addServer(bot.servers[server]);
    }
  },
  
  _save: function() {
    var replacer = function(key,value) {
      if ( key == "neglect_timeout" ) return undefined; // this key is an internal that we dont want to save 
      else return value;
    };
    fs.writeFileSync('./state.json', JSON.stringify(this.servers, replacer) , 'utf-8'); 
  },
  
  save: function() {
    this._save();
  },
  
  load: function() {
    try {
      var file = require('./state.json');
      for ( var server_id in file ) {
        var server = new Server(file[server_id], server_id);
        this.servers[server_id] = server;
        server.init();
      }
    } catch (ex) {
      console.error("Failed to load state from file");
      this._save();
    }
  },
};

function Server(server_data, server_id) {       
  this.server_id = server_id;
  this.server_name = bot.servers[server_id].name;
  this.server_owner_user_id = bot.servers[server_id].owner_id;
  this.server_owner_username = bot.users[this.server_owner_user_id].username;
  this.bound_to = server_data.bound_to || null;
  this.bound_to_username = server_data.bound_to_username || null;
  this.current_voice_channel_id = server_data.current_voice_channel_id || null;
  this.permitted = server_data.permitted || {};
  this.neglect_timeout = null;
  this.neglect_neglect = !!server_data.neglect_neglect;
  this.language = server_data.language || 'en';
  
  this.sfx = {
    airhorn: 'sfx/airhorn.mp3',
  };

  this.init = function() {
    if ( this.isBound() ) {
      this._setMaster(this.bound_to, this.bound_to_username);
    }
    else {
      // inits empty
      this.release();
    }
    
    var voiceChan = getUserVoiceChannel(this.bound_to);
    if ( voiceChan ) {
      if ( !this.isServerChannel(voiceChan))
        this.leaveVoiceChannel();
      else 
        this.joinVoiceChannel(voiceChan);
    }
  };
  
  this._setMaster = function(user_id, username) {
    this.resetNeglectTimeout();
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
  };
  
  this.setMaster = function(user_id, username) {
    this._setMaster(user_id, username);
    world.save();
  };
  
  this.isServerChannel = function(channel_id) {
    return bot.channels[channel_id].guild_id == this.server_id ;
  };
  
  this._release = function() {
    this.bound_to = null;
    this.bound_to_username = null;
    this.permitted = {};
    this.neglect_timeout = null;
    if ( this.inChannel() )
      this.leaveVoiceChannel();
    
    world.save();
  };

  this.release = function() {
    this._release();
    world.save();
  };  
  
  this.isMaster = function(user_id) {
    return this.bound_to == user_id;
  };
  
  this.isBound = function() {
    return this.bound_to != null;
  };
  
  this.inChannel = function() {
    return this.current_voice_channel_id != null;
  };
  
  this.isPermitted = function(user_id) {
    return this.permitted[user_id] != null;
  };
    
  this.joinVoiceChannel = function(channel_id, callback) {
    var server = this;
    if ( !server.isServerChannel(channel_id) ) return;
    if ( !callback ) callback = function() {};
    bot.joinVoiceChannel(channel_id, function(error, events) { 
      if ( error ) { 
        console.error(error);
        server.current_voice_channel_id = null;
      }
      else {
        server.current_voice_channel_id = channel_id;
        console.log('joined channel: ' + channel_id); 
        callback();
      }
      
      world.save();
    });
  };
  
  this.leaveVoiceChannel = function(callback) {
    if ( !callback ) callback = function() {};
    
    // HACK: delay the timeout as the callback sometimes runs before the state = left
    var callback_timeout = function() {
      setTimeout(callback, 2000);
    };
    
    if ( this.current_voice_channel_id != null )
      bot.leaveVoiceChannel(this.current_voice_channel_id, callback_timeout);
    this.current_voice_channel_id = null;
      
    world.save();
  };
  
  this.permit = function(user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = {};
    world.save();
  };
  
  this.unpermit = function(user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = null;
    world.save();
  };
  
  this.resetNeglectTimeout = function() {
    
    var server = this;
    
    if ( server.neglect_neglect ) 
    {
      if ( this.neglect_timeout ) 
        clearTimeout(this.neglect_timeout);
    }
    else
    {
      var neglected_timeout = function() {
        server.neglected();
      };
      
      if ( this.neglect_timeout ) 
        clearTimeout(this.neglect_timeout);
      this.neglect_timeout = setTimeout(neglected_timeout, world.NEGLECT_TIMEOUT_IN_MS);
    }
  };
    
  this.talk = function(message, language) {
    this.resetNeglectTimeout();
    this._talk(message, language);
  };
  
  this._talk = function(message, language, callback) {
    var server = this;
    var play_padding = (message.length < 20);
    if ( !callback ) callback = function() {};
    
    tts(message, language || server.language, 1)
    .then(function(url) {
      bot.getAudioContext(server.current_voice_channel_id, function(error, stream) {
        if ( error) return console.error(error);
                
        try {
                    
          request
            .get(url)
            .on('end', function() {
              if ( play_padding )
                fs.createReadStream('./padding.mp3')
                .on('end', callback)            
                .pipe(stream, {end:false})
                .on('error', function(err) {
                  console.error('Error writing to discord voice stream. ' + err);
                });
              else 
                callback();
            })
            .on('error', function(err) {
              console.error('Error fetching: ' + url + ". " + err);
            })
            .pipe(stream, {end:false});
            
            // memory leak here, have to only do this once
            /*.on('error', function(err) {
              console.error('Error writing to discord voice stream. ' + err);
            });*/
        }
        catch( ex ) {
          console.error(ex);
        }
      });
    })
    .catch(function(err) {
      console.error(err.stack);
    });
  };
  
  this.neglected = function() {
    var server = this;
    // delay for 3 seconds to allow the bot to talk
    var neglected_release = function() {
      var timeout_neglected_release = function() { server.release(); };
      setTimeout(timeout_neglected_release, 3000);
    };
    
    if ( this.inChannel() )
      this._talk("I feel neglected, I'm leaving", server.language, neglected_release);
    else 
      this.release();    
  };
  
  this.playAudioFile = function(filename, callback) {
    if ( !callback ) callback = function() {};
    bot.getAudioContext(this.current_voice_channel_id, function(error, stream) {
      if ( error) return console.error(error);
              
      try {
        fs.createReadStream(filename)
        .on('end', callback)            
        .pipe(stream, {end:false})
        .on('error', function(err) {
          console.error('Error writing to discord voice stream. ' + err);
        });
      }
      catch( ex ) {
        console.error(ex);
      }
    });
  };
  
};

var bot = new Discord.Client({
  token: auth.token,
  autorun: true
});

bot.on('ready', function (evt) {
  console.log('Logged in as: '+ bot.username + ' - (' + bot.id + ')');

  // cool status 
  bot.setPresence({ 
    status: 'online',
    game: {
      name: auth.tagline || 'Killing all the humans',
      type: 1,
      url: ''
    }
  });
    
  // init all other servers 
  world.initServers();
  // load the state  
  world.load();
  
});

bot.on('disconnect', function(evt) {
  console.log('Disconnected');
  bot.connect();
});

bot.on('any', function(evt) {
  console.log(evt.t);
  
 
  if ( evt.t == 'VOICE_STATE_UPDATE' ) {
    // if my master's voice status changes
    var channel_id = null;
    if ( evt.d ) 
      var channel_id = evt.d.channel_id; 
    var server = world.getServerFromChannel(channel_id);
    if ( server == null ) { 
      world.checkMastersVoiceChannels(evt.d.user_id);
      return null;
    }
    
    
    if ( evt.d && server.isMaster(evt.d.user_id)) {
      
      if ( !channel_id ) {
        if ( server.inChannel() )
          server.leaveVoiceChannel();
      }      
      else if ( !isVoiceChannel(channel_id))
        console.log('Not a voice channel');
      else {
        server.joinVoiceChannel(channel_id);
      }
    }
  }
});

bot.on('message', function (username, user_id, channel_id, message, evt) {

  var command_char = auth.command_char || '!';

  if ( isExcluded(message)) return null;

  var server = world.getServerFromChannel(channel_id);
  if ( server == null ) {
    console.error("Can't find server for " + channel_id);
    return null;
  }

  // is the message a command?
  if (message.substring(0, command_char.length) == command_char) {
    var args = message.substring(command_char.length).split(' ');
    var cmd = args[0];
   
    args = args.splice(1);
    switch(cmd) {
      
      // find out who the current master for this server is
      case 'who':
     
        var master_nick = getNickFromUserId(channel_id, server.bound_to);
        if ( !master_nick )
          master_nick = server.bound_to;
        if ( !master_nick )
          sendMessage(channel_id, "I have no master :~(");
        else 
          sendMessage(channel_id, "My master is " + master_nick);
        break;
        
      // !ping
      case 'ping':
        sendMessage(channel_id, 'Pong!');
        break;
        
      // make you the bots master and have all permissions
      case 'follow':
      
        if ( server.isBound() ) {
          if ( !server.isMaster(user_id)) {
            var master_nick = getNickFromUserId(channel_id, server.bound_to);
            if ( !master_nick )
              master_nick = server.bound_to;
            sendMessage(channel_id, "Sorry, " + master_nick + " is my master today. Get them to release me from my bonds and I'll serve you.");
          }
          else {
            sendMessage(channel_id, "Yes master?");
          }
        }
        else {
          server.setMaster(user_id, username);
          var voiceChan = getUserVoiceChannel(user_id);
          if ( voiceChan )
            server.joinVoiceChannel(voiceChan);
          sendMessage(channel_id, "Yes, master!");
        }
        break;
      
      // release the bot some it can follow someone else
      case 'unfollow':
        if ( server.isBound() ) {
          if ( !server.isMaster(user_id)) {
            sendMessage(channel_id, "Sorry, you're not my master");
          }
          else {
            server.release();
            sendMessage(channel_id, "Goodbye master");
          }
        }
        else
          sendMessage(channel_id, "I have no master... would you like to be my master?");
        break;
      
      // permit another user to use the TTS capability
      case 'permit':      
        if ( args.length == 0 ) break;
        
        if ( !server.isMaster(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
        }
        else {
          var target_id = getDiscordUserIdFromMessage(args[0]);
          if ( target_id ) {
            var nick = getNickFromUserId(channel_id, target_id);
            if ( !nick )
              nick = target_id;
            server.permit(target_id);
            sendMessage(channel_id, "I'll listen to " + nick + " now"); 
          }
          else {
            sendMessage(channel_id, "I don't know who " + args[0] + " is?");
          }
        }
        break;
      
      // unpermit another user from using the TTS capability
      case 'unpermit':
     
        if ( !server.isPermitted(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not permitted.");
        }
        else {
          var target_id = user_id; 
          if ( args.length > 0 ) 
            target_id = getDiscordUserIdFromMessage(args[0]);
          if ( target_id != user_id && !server.isMaster(user_id))
            sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
          else if ( target_id == user_id || server.isMaster(user_id) ) {
            var nick = getNickFromUserId(channel_id, target_id);
            server.unpermit(target_id);
            sendMessage(channel_id, nick + " talk to the hand"); 
          }
          else {
            sendMessage(channel_id, "I don't know who " + args[0] + " is?");
          }
        }
        break;
           
      // leave the voice channel
      case 'leave':
        if ( server.isBound() && !server.isMaster(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
        }
        else {
          server.leaveVoiceChannel();
        }
        break;
        
      // join a voice channel
      case 'join':
        if ( !server.isMaster(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
        }
        else {
          var voiceChan = getUserVoiceChannel(user_id);
          if ( voiceChan )
            server.joinVoiceChannel(voiceChan);
          else {
            sendMessage(channel_id, "You're not in a voice channel?");
          }
        }
        break;
        
      // play a sound effect from the library
      case 'sfx':
        if ( server.inChannel() ) {
          if ( server.isPermitted(user_id) ) {
            var filename = server.sfx[args[0]]; // world.sfx
            if ( filename )
              server.playAudioFile(filename);
          }
        }
        break;
        
      // set the language the bot should use default is en, other examples: en-AU, de-DE, eu-CA 
      case 'lang':
        if ( args.length == 0 ) break;
        if ( !server.isMaster(user_id))
          sendMessage(channel_id, "Sorry, you're not my master");
        else {
          server.language = args[0];
          sendMessage(channel_id, "OK, I'll now speak using language " + server.language);
        }
        break;
        
      // toggle the neglect function
      case 'toggle_neglect':
      
        if ( !server.isMaster(user_id))
          sendMessage(channel_id, "Sorry, you're not my master");
        else {
          server.neglect_neglect = !server.neglect_neglect;
          if ( server.neglect_neglect )
            sendMessage(channel_id, "Neglecting neglect");
          else 
            sendMessage(channel_id, "Attending neglect");
        }
        break;
        
      // used by the devs to drop the bot remotely
      case 'debugbork':
        // special dev permissions here
        debugbork(user_id);
        break;
        
      // set your personal language to use with tts, see !lang for examples 
      case 'mylang':
        if ( args.length == 0 ) break; 
        if ( server.isPermitted(user_id)) {
          server.permitted[user_id].language = args[0];
          sendMessage(channel_id, "OK, your personal language is now " + args[0]);
        }
        else 
          sendMessage(channel_id, "Sorry, you're not permitted");
        
        break;
      
      // leave and join the voice channel - for fixing bugginess
      case 'reset':
        if ( !server.isMaster(user_id)) break;
        var voiceChan = getUserVoiceChannel(user_id);
        if ( voiceChan ) {
          server.leaveVoiceChannel(function() {
            server.joinVoiceChannel(voiceChan);
          });
        }
        break;
    }
  }
  else { 
    console.log(message);
    if ( message == null ) return;
    
    // tts bit
    message = message.trim();
    message = message.replace('\n', ' ');
    message = awesomeHacks(message);
    message = stripRepeatingChars(message, 6);
    message = resolveDiscordSnowflakes(channel_id, message);
    message = stripUrls(message);
    
    if ( message.length > 199 ) return;
    if ( message.length < 1 ) return;

    if ( server.inChannel() ) {
      if ( server.isPermitted(user_id) ) {
        server.talk(message, server.permitted[user_id].language);
      }
    }
  }
});


// kill the app for debugging purposes
function debugbork(user_id) {  
  const WootUserId = 279935071165743105, FaxUserId = 240365702790381568;
  
  if ( user_id == WootUserId || user_id == FaxUserId ) {
    console.log('Woot or fax killed me');
    world.save();
    bot.disconnect();
    process.exit();
  }
}

process.on( 'SIGINT', function() {
  world.save();
  bot.disconnect();
  process.exit();
}); 
