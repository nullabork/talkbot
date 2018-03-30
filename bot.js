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
  bot.sendMessage({
      to: channel_id,
      message: message
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
  return "";
};

function convertCamelCaseNicksToEnglish( nick_name ) {
  return nick_name.replace(/([a-z])([A-Z])/g, function(a,b,c){
    return b + " " + c;
  });
};

function convertDiscordUserIdsToNicks(channel_id, message) {
  return message.replace(/<@\!(\d{12,19})>/g, function(a,b){
    return convertCamelCaseNicksToEnglish(getNickFromUserId(channel_id, b));
  })
};

function stripUrls(message) {
  return message.replace(/(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))?/g, "");
};

var bondage = {
  bound_to: null,
  bound_to_username: null,
  current_voice_channel_id: null,
  permitted: [],
  
  setMaster: function(user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
  },
  
  release: function() {
    this.bound_to = null;
    this.bound_to_username = null;
    this.permitted = [];
    if ( this.inChannel() )
      this.leaveVoiceChannel();
  },
  
  isMaster: function(user_id) {
    return this.bound_to == user_id;
  },
  
  isBound: function() {
    return this.bound_to != null;
  },
  
  inChannel: function() {
    return this.current_voice_channel_id != null;
  },
  
  isPermitted: function(user_id) {
    return this.permitted[user_id] != null;
  },
    
  joinVoiceChannel: function(channel_id) {
    this.current_voice_channel_id = channel_id;
    bot.joinVoiceChannel(channel_id, function(error, events) { 
      if ( error ) this.current_voice_channel_id = null;
      console.log('joined channel: ' + channel_id); 
    });
  },
  
  leaveVoiceChannel: function() {
    if ( this.current_voice_channel_id != null )
      bot.leaveVoiceChannel(this.current_voice_channel_id);
    this.current_voice_channel_id = null;
  },
  
  shutup: function() {
    bot.getAudioContext(bondage.current_voice_channel_id, function(error, stream) {
      stream.stop();
    });    
  },
  
  permit: function(user_id) {
    this.permitted[user_id] = true;
  },
  unpermit: function(user_id) {
    this.permitted[user_id] = null;
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
        sendMessage(channel_id, "My master is " + getNickFromUserId(channel_id, bondage.bound_to));
        break;
      // !ping
      case 'ping':
        bot.sendMessage({
            to: channel_id,
            message: 'Pong!'
        });
        break;
      case 'follow':
        if ( bondage.isBound() ) {
          if ( !bondage.isMaster(user_id))
            sendMessage(channel_id, "Sorry, "+getNickFromUserId(channel_id, bondage.bound_to)+" is my master today. Get them to release me from my bonds and I'll serve you.");
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
        if ( !bondage.isMaster(user_id)) break;
        if ( bondage.isBound() ) {
          bondage.release();
          sendMessage(channel_id, "Goodbye master");
        }
        else
          sendMessage(channel_id, "I have no master... would you like to be my master?");
        break;
        
      case 'permit':
        if ( !bondage.isMaster(user_id)) break;
        var target_id = getDiscordUserIdFromMessage(args[0]);
        if ( target_id ) {
          bondage.permit(target_id);
          sendMessage(channel_id, "I'll listen to " + getNickFromUserId(channel_id, target_id) + " now"); 
        }
        break;
        
      case 'unpermit':
        if ( !bondage.isMaster(user_id)) break;
        var target_id = getDiscordUserIdFromMessage(args[0]);
        if ( target_id ) {
          bondage.unpermit(target_id);
          sendMessage(channel_id, getNickFromUserId(channel_id, target_id) + " talk to the hand"); 
        }
        break;
        
      case '!':
        bondage.shutup();
        break;
        
      case 'leave':
        if ( !bondage.isMaster(user_id)) break;
        bondage.leaveVoiceChannel();
        break;
      case 'join':
        if ( !bondage.isMaster(user_id)) break;
        var voiceChan = getUserVoiceChannel(user_id);
        if ( voiceChan )
          bondage.joinVoiceChannel(voiceChan);
        break;
    }
  }
  else { // tts that
    message = message.replace('\n', ' ');
    message = convertDiscordUserIdsToNicks(channel_id, message);
    message = stripUrls(message);
    
    if ( message.length > 199 ) return;
    if ( message.length < 1 ) return;
    
//    if ( message.length < 20 ) message = message.padEnd(20, '_');
    if ( bondage.isPermitted(user_id) && bondage.inChannel() ) {
      tts(message, 'en', 1).then(function(url) {
        console.log(url);
        bot.getAudioContext(bondage.current_voice_channel_id, function(error, stream) {
          if ( error) return console.error(error);
          request
            .get(url)
            .on('end', function() {console.log("Done : " + url);})
            .pipe(stream, {end:false})
            .on('end', function() { console.log('Discord got: ' + url); fs.createReadStream('./padding.mp3').pipe(stream, {end:false});});
            
           
        });
      })
      .catch(function(err) {
        console.error(err.stack);
      });

    }
  }
});

