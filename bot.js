var Discord = require('discord.io');
var auth = require('./auth.json');
var tts = require('google-tts-api');
var request = require('request');
var fs = require('fs');

function listVoiceChannels(server) {
  var channels = bot.servers[server].channels;
  for (var channel in channels) {
    if (channels[channel].type === 2) {
      console.log(channel + " - " + channels[channel].name);
    }
  }
}

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

function getNickFromUserId( channel_id, user_id ) {
  for ( var server in bot.servers ) {
    if ( bot.servers[server].members[user_id] && bot.servers[server].channels[channel_id] ) {
      return bot.servers[server].members[user_id].nick;        
    }
  }
  return null;
};

function convertCamelCaseNicksToEnglish( nick_name ) {
  return nick_name.replace(/([a-z])([A-Z])/g, function(a,b,c){
    return b + " " + c;
  });
};

function convertDiscordUserIdsToNicks(channel_id, message) {
  return message.replace(/<@\!(\d{12,19})>/g, function(a,b){
    var nick = getNickFromUserId(channel_id, b);
    if ( !nick ) {
      console.error('Cant find nick for ' + b);
      return b;
    }
    else     
      return convertCamelCaseNicksToEnglish(nick);
  })
};

function stripUrls(message) {
  return message.replace(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/g, "");
};

function neglected_timeout() {
  console.log("Neglected");
  bondage.neglected();
};

function timeout_neglected_release() {
  bondage.release();
};
function neglected_release() {
  setTimeout(timeout_neglected_release, 3000);
};

var bondage = {
  NEGLECT_TIMEOUT_IN_MS: 30 * 60 * 1000, // 30 mins
  
  state: {
    bound_to: null,
    bound_to_username: null,
    current_voice_channel_id: null,
    permitted: {},
  },
  
  neglect_timeout: null,
  
  setMaster: function(user_id, username) {
    this.resetNeglectTimeout();
    this.state.bound_to = user_id;
    this.state.bound_to_username = username;
    this.permit(user_id);
    this._save();
  },
  
  release: function() {
    this.state.bound_to = null;
    this.state.bound_to_username = null;
    this.state.permitted = {};
    this.current_voice_channel_id = null;
    this.neglect_timeout = null;
    if ( this.inChannel() )
      this.leaveVoiceChannel();
    this._save();
  },
  
  isMaster: function(user_id) {
    return this.state.bound_to == user_id;
  },
  
  isBound: function() {
    return this.state.bound_to != null;
  },
  
  inChannel: function() {
    return this.state.current_voice_channel_id != null;
  },
  
  isPermitted: function(user_id) {
    return this.state.permitted[user_id] != null;
  },
    
  joinVoiceChannel: function(channel_id, callback) {
    if ( !callback ) callback = function() {};
    bot.joinVoiceChannel(channel_id, function(error, events) { 
      if ( error ) { 
        console.error(error);
        bondage.state.current_voice_channel_id = null;
      }
      else {
        bondage.state.current_voice_channel_id = channel_id;
        console.log('joined channel: ' + channel_id); 
        callback();
      }
    });
    this._save();
  },
  
  leaveVoiceChannel: function(callback) {
    if ( !callback ) callback = function() {};
    if ( this.state.current_voice_channel_id != null )
      bot.leaveVoiceChannel(this.state.current_voice_channel_id, callback);
    this.state.current_voice_channel_id = null;
    this._save();
  },
  
  shutup: function() {
    this.resetNeglectTimeout();
    bot.getAudioContext(bondage.state.current_voice_channel_id, function(error, stream) {
      stream.stop();
    });    
  },
  
  permit: function(user_id) {
    this.resetNeglectTimeout();
    this.state.permitted[user_id] = true;
    this._save();
  },
  unpermit: function(user_id) {
    this.resetNeglectTimeout();
    this.state.permitted[user_id] = null;
    this._save();
  },
  
  resetNeglectTimeout: function() {
    if ( this.neglect_timeout ) 
      clearTimeout(this.neglect_timeout);
    this.neglect_timeout = setTimeout(neglected_timeout, this.NEGLECT_TIMEOUT_IN_MS);
  },
  
  talk: function(message) {
    this.resetNeglectTimeout();
    this._talk(message);
  },
  
  _talk: function(message, callback) {
    var play_padding = (message.length < 20);
    if ( !callback ) callback = function() {};
    tts(message, 'en', 1).then(function(url) {
      console.log(message);
      bot.getAudioContext(bondage.state.current_voice_channel_id, function(error, stream) {
        if ( error) return console.error(error);
                
        try {
          request
            .get(url)
            .on('end', function() {
              if ( play_padding )
                fs.createReadStream('./padding.m4a')
                .on('end', callback)            
                .pipe(stream, {end:false})
                .on('error', function() {
                  console.error('Error writing to discord voice stream');
                });
              else 
                callback();
            })
            .on('error', function() {
              console.error('Error fetching: ' + url);
            })
            .pipe(stream, {end:false});
            
            // memory leak here, have to only do this once
            /*.on('error', function() {
              console.error('Error writing to discord voice stream');
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
  },
  neglected: function() {
    if ( this.inChannel() )
      this._talk("I feel neglected, I'm leaving", neglected_release);
    else 
      this.release();    
  },
  
  _save: function() {
    fs.writeFileSync('./state.json', JSON.stringify(this.state) , 'utf-8'); 
  },
  
  load: function() {
    try {
      var file = require('./state.json');
      this.state = file;
      if ( this.isBound() )
        this.setMaster(this.state.bound_to, this.state.bound_to_username);
      var voiceChan = getUserVoiceChannel(this.state.bound_to);
      if ( voiceChan )
        this.joinVoiceChannel(voiceChan);
      
    } catch (ex) {
      console.log("Failed to load state from file");
      this._save();
    }
  },
};


var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
  console.log('Connected');
  console.log('Logged in as: ');
  console.log(bot.username + ' - (' + bot.id + ')');
  // load the state
  bondage.load();
});
bot.on('disconnect', function(evt) {
  console.log('Disconnected');
  bot.connect();
});

bot.on('any', function(evt) {
  
  if ( evt.d && bondage.isPermitted(evt.d.user_id)) {
    if ( evt.t == 'VOICE_STATE_UPDATE' ) {
      
      var channel_id = evt.d.channel_id; 
      
      if ( !channel_id ) {
        if ( bondage.inChannel() )
          bondage.leaveVoiceChannel();
      }      
      else if ( !isVoiceChannel(channel_id))
        console.log('Not a voice channel');
      else {
        bondage.joinVoiceChannel(channel_id);
      }
    }
  }
  //console.log(evt);
});

bot.on('message', function (username, user_id, channel_id, message, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.substring(0, 1) == '!') {
    var args = message.substring(1).split(' ');
    var cmd = args[0];
   
    args = args.splice(1);
    switch(cmd) {
      case 'who':
     
        var master_nick = getNickFromUserId(channel_id, bondage.state.bound_to);
        if ( !master_nick )
          master_nick = bondage.state.bound_to;
        sendMessage(channel_id, "My master is " + master_nick);
        break;
        
      // !ping
      case 'ping':
        sendMessage(channel_id, 'Pong!');
        break;
        
      case 'follow':
      
        if ( bondage.isBound() ) {
          if ( !bondage.isMaster(user_id)) {
            var master_nick = getNickFromUserId(channel_id, bondage.state.bound_to);
            if ( !master_nick )
              master_nick = bondage.state.bound_to;
            sendMessage(channel_id, "Sorry, "+master_nick+" is my master today. Get them to release me from my bonds and I'll serve you.");
          }
          else {
            sendMessage(channel_id, "Yes master?");
          }
        }
        else {
          bondage.setMaster(user_id, username);
          var voiceChan = getUserVoiceChannel(user_id);
          if ( voiceChan )
            bondage.joinVoiceChannel(voiceChan);
          sendMessage(channel_id, "Yes, master!");
        }
        break;
        
      case 'unfollow':
        if ( bondage.isBound() ) {
          if ( !bondage.isMaster(user_id)) {
            sendMessage(channel_id, "Sorry, you're not my master");
          }
          else {
            bondage.release();
            sendMessage(channel_id, "Goodbye master");
          }
        }
        else
          sendMessage(channel_id, "I have no master... would you like to be my master?");
        break;
        
      case 'permit':
        if ( !bondage.isMaster(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
        }
        else {
          var target_id = getDiscordUserIdFromMessage(args[0]);
          if ( target_id ) {
            var nick = getNickFromUserId(channel_id, target_id);
            if ( !nick )
              nick = target_id;
            bondage.permit(target_id);
            sendMessage(channel_id, "I'll listen to " + nick + " now"); 
          }
          else {
            sendMessage(channel_id, "I don't know who " + args[0] + " is?");
          }
        }
        break;
        
      case 'unpermit':
        if ( !bondage.isMaster(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
        }
        else {
          var target_id = getDiscordUserIdFromMessage(args[0]);
          if ( target_id ) {
            var nick = getNickFromUserId(channel_id, target_id);
            bondage.unpermit(target_id);
            sendMessage(channel_id, nick + " talk to the hand"); 
          }
          else {
            sendMessage(channel_id, "I don't know who " + args[0] + " is?");
          }
        }
        break;
        
      case '!':
        bondage.shutup();
        break;
        
      case 'leave':
        if ( !bondage.isMaster(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
        }
        else {
          bondage.leaveVoiceChannel();
        }
        break;
        
      case 'join':
        if ( !bondage.isMaster(user_id)) {
          sendMessage(channel_id, "Sorry I can't do that, you're not my master.");
        }
        else {
          var voiceChan = getUserVoiceChannel(user_id);
          if ( voiceChan )
            bondage.joinVoiceChannel(voiceChan);
          else {
            sendMessage(channel_id, "You're not in a voice channel?");
          }
        }
        break;
        
      case 'reset':
        if ( !bondage.isMaster(user_id)) break;
        var voiceChan = getUserVoiceChannel(user_id);
        if ( voiceChan ) {
          bondage.leaveVoiceChannel(function() {
            bondage.joinVoiceChannel(voiceChan);
          });
        }
        break;
    }
  }
  else { // tts that
    message = message.replace('\n', ' ');
    message = convertDiscordUserIdsToNicks(channel_id, message);
    message = stripUrls(message);
    
    if ( message.length > 199 ) return;
    if ( message.length < 1 ) return;

    if ( bondage.inChannel() ) {
      if ( bondage.isPermitted(user_id) ) {
        bondage.talk(message);
      }
    }
  }
});

