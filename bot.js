//npm imports
var fs = require('fs'),
  request = require('request'),
  Discord = require('discord.io'),
  textToSpeech = require('@google-cloud/text-to-speech');

//local imports
var auth = require('./auth.json'),
  SSML = require('./discord-to-ssml'),
  hacks = require('./modules/awesome-hacks.js');

// Creates a client
var tts_client = new textToSpeech.TextToSpeechClient();

var bot = new Discord.Client({
  token: auth.token,
  autorun: true
});

var ssml = new SSML({

});

function isVoiceChannel(channel_id) {
  if ( !channel_id ) return false;
  return ( bot.channels[channel_id].type == 2 ); 
};

function isExcluded(message) {
  return message.startsWith('```');
};

function isUserInVoiceChannel(user_id) {
  if ( !user_id ) return false;
  return getUserVoiceChannel(user_id) != null;
};

function getUserVoiceChannel(user_id) {
  if ( !user_id ) return;
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

function is_dev(user_id) {
  const WootUserId = 279935071165743105, FaxUserId = 240365702790381568;
  
  if ( user_id == WootUserId || user_id == FaxUserId ) return true;
  return false;
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
  return message.replace(/<@!{0,1}(\d{12,19})>/g, function(a,b){
    return b;
  });
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

var world = {
  NEGLECT_TIMEOUT_IN_MS: 30 * 60 * 1000, // 30 mins

  servers: {},
  
  addServer: function(serverObj) {
    this.servers[serverObj.id] = new Server(serverObj, serverObj.id);
    
    this.save();
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
    if ( !user_id ) return;
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
  
  _save: function( _filename ) {
    var replacer = function(key,value) {
      if ( key == "neglect_timeout" ) return undefined; // this key is an internal that we dont want to save 
      else return value;
    };
    
    if ( !_filename ) _filename = "./state.json";
    fs.writeFileSync(_filename, JSON.stringify(this.servers, replacer) , 'utf-8'); 
  },
  
  save: function( _filename ) {
    this._save( _filename );
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

  console.log("NEW SERVER: " + server_id);

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
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
  };
  
  this.setMaster = function(user_id, username) {
    console.log('setMaster(' + user_id + ')');
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
    clearTimeout(this.neglect_timeout);
    this.neglect_timeout = null;
    if ( this.inChannel() )
      this.leaveVoiceChannel();
    
    world.save();
  };

  this.release = function() {
    console.log('release');
    this._release();
    world.save();
  };  
  
  this.isMaster = function(user_id) {
    if ( !user_id ) return false;
    return this.bound_to == user_id;
  };
  
  this.isBound = function() {
    return this.bound_to != null;
  };
  
  this.inChannel = function() {
    return this.current_voice_channel_id != null;
  };
  
  this.isPermitted = function(user_id) {
    if ( !user_id ) return false;
    return this.permitted[user_id] != null;
  };
    
  this.joinVoiceChannel = function(channel_id, callback) {
    var server = this;
    if ( !server.isServerChannel(channel_id) ) {
      console.log("joinVoiceChannel() on the wrong server");
      return;
    }
    
    if ( !callback ) callback = function() {};
    bot.joinVoiceChannel(channel_id, function(error, events) { 
      if ( error ) { 
        console.error(error);
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
      clearTimeout(server.neglect_timeout);
      server.neglect_timeout = null;
    }
    else
    {
      var neglected_timeout = function() {
        server.neglected();
      };
      
      clearTimeout(server.neglect_timeout);
      server.neglect_timeout = setTimeout(neglected_timeout, world.NEGLECT_TIMEOUT_IN_MS);
    }
  };
    
  this.talk = function(message, options) {
    this.resetNeglectTimeout();
    this._talk(message, options);
  };
  
  this._talk = function(message, options, callback) {
    var server = this;
    var play_padding = (message.length < 20);
    if ( !callback ) callback = function() {};
    
    var request = {
      input: {text: message},
      // Select the language and SSML Voice Gender (optional)
      voice: {
        languageCode: options.language || server.language, 
        ssmlGender: options.gender || 'NEUTRAL',
        name: options.voice_name || '',      
      },
      // Select the type of audio encoding
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: options.pitch || 0.0,
        speakingRate: options.speed || 1.0,
      },
    };
    
    if ( options.use_ssml )
      request.input = {text: null, ssml: message};

    
    console.log(request);

    // Performs the Text-to-Speech request
    tts_client.synthesizeSpeech(request, (err, response) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }

      console.log(response);
      
      bot.getAudioContext(server.current_voice_channel_id, function(error, stream) {
        if ( error) return console.error(error);
                        
        try {
          
          stream.write(response.audioContent);
                    // if content length is too short don't play it
//          response.audioContent.pipe(stream, {end:false});
        }
        catch( ex ) {
          console.error(ex);
        }
      });
            

    });
    
  /*  tts(message, language || server.language, 1)
    .then(function(url) {
      bot.getAudioContext(server.current_voice_channel_id, function(error, stream) {
        if ( error) return console.error(error);
                        
        try {
                    // if content length is too short don't play it
          request
            .get(url)
            .on('response', function(response) {
              if ( response.headers['content-length'] < 1024 ) 
                this.end();
            })
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
            });
        }
        catch( ex ) {
          console.error(ex);
        }
      });
    })
    .catch(function(err) {
      console.error(err.stack);
    });*/
  };
  
  this.neglected = function() {
    var server = this;

    if ( server.neglect_neglect ) return;
    // delay for 3 seconds to allow the bot to talk
    var neglected_release = function() {
      var timeout_neglected_release = function() { server.release(); };
      setTimeout(timeout_neglected_release, 3000);
    };
    
    if ( server.inChannel() )
      server._talk("I feel neglected, I'm leaving", server, neglected_release);
    else 
      server.release();    
  };
  
  this.setNicks = function(channel_id, tokens) {
    
    var i = 0;
    
    if ( bot.servers[this.server_id] == null ) { console.log('no server'); return; }
    if ( bot.servers[this.server_id].channels[channel_id] == null ) { 
      
      for ( var chan in bot.servers[this.server_id].channels ) 
        console.log(bot.servers[this.server_id].channels[chan]);
      return; 
    }

    for ( var member in bot.servers[this.server_id].channels[channel_id].members )
    {
      if ( args.length - 3 <= i ) return;
      bot.editNickname({
        serverID: this.server_id, 
        userID: member, 
        nick: tokens[i++] + ' ' + tokens[i++] + ' ' + tokens[i++],
      });
    }    
   
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
  
  if ( evt.t == 'GUILD_CREATE' ) {
    
    // when added to a server do this - need to wait a bit for the library to init
    var add_server = function() { world.addServer(bot.servers[evt.d.id]); };
    
    setTimeout(add_server, 10000);
  }
  else if ( evt.t == 'VOICE_STATE_UPDATE' ) {
    // if my master's voice status changes
    var channel_id = null;
    if ( evt.d ) 
      var channel_id = evt.d.channel_id; 
    var server = world.getServerFromChannel(channel_id);
    if ( server == null ) { 
      console.log("What server?: " + channel_id);
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

    server.resetNeglectTimeout();
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
          console.log('YOU ARENT EVEN');
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
            server.permit(target_id);
            var nick = getNickFromUserId(channel_id, target_id);
            if ( !nick )
              nick = target_id;
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
            server.unpermit(target_id);
            var nick = getNickFromUserId(channel_id, target_id);
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

      case 'mygender':
        if ( args.length == 0 ) break; 
        if ( server.isPermitted(user_id)) {
          server.permitted[user_id].gender = args[0];
          sendMessage(channel_id, "OK, your personal gender is now " + args[0]);
        }
        else 
          sendMessage(channel_id, "Sorry, you're not permitted");
        
        break;
        
      case 'myvoice':
        if ( args.length == 0 ) break; 
        if ( server.isPermitted(user_id)) {
          server.permitted[user_id].voice_name = args[0];
          sendMessage(channel_id, "OK, your personal voice is now " + args[0]);
        }
        else 
          sendMessage(channel_id, "Sorry, you're not permitted");
        
        break;
      
      case 'mypitch':
        if ( args.length == 0 ) break; 
        if ( server.isPermitted(user_id)) {
          server.permitted[user_id].pitch = args[0] * 1.0;
          sendMessage(channel_id, "OK, your personal pitch is now " + args[0]);
        }
        else 
          sendMessage(channel_id, "Sorry, you're not permitted");
        
        break;
        
      case 'toggle_ssml':
        if ( server.isPermitted(user_id)) {
          server.permitted[user_id].use_ssml = !server.permitted[user_id].use_ssml;
          sendMessage(channel_id, "OK, your you now need to speak in SSML");
        }
        else 
          sendMessage(channel_id, "Sorry, you're not permitted");
        break;
        
      case 'myspeed':
        if ( args.length == 0 ) break; 
        if ( server.isPermitted(user_id)) {
          server.permitted[user_id].speed = args[0] * 1.0;
          sendMessage(channel_id, "OK, your personal speed is now " + args[0]);
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
        
      case 'nickcycle':
        console.log(args);
        if ( !is_dev(user_id)) break;
        server.setNicks(getUserVoiceChannel(user_id), args);
        break;
        
      case 'ohshit':
        world.save('./ohshit'+(new Date().getTime()) + '.json');
        sendMessage(channel_id, "Saved a debug file");
        break;
    }
  }
  else { 
    if ( message == null ) return;
    
    // tts bit
    message = resolveDiscordSnowflakes(channel_id, message);
    if ( !server.permitted[user_id] || !server.permitted[user_id].use_ssml )
      message = hacks.parse(channel_id, message);
      message = ssml.build(message);

    if ( message.length < 1 ) return;

    if ( server.inChannel() ) {
      if ( server.isPermitted(user_id) ) {
        server.talk(message, server.permitted[user_id]);
      }
    }
  }
});


// kill the app for debugging purposes
function debugbork(user_id) {  
  
  if ( is_dev(user_id) ) {
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
