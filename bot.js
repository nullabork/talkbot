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

var bondage = {
  bound_to: null,
  bound_to_username: null,
  current_voice_channel_id: null,
  
  setMaster: function(user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
  },
  
  release: function() {
    this.setMaster(null, null);
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
      //stream.stop();
    });    
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
bot.on('any', function(evt) {
  
  if ( evt.d && bondage.isMaster(evt.d.user_id)) {
    if ( evt.t == 'VOICE_STATE_UPDATE' ) {
      
      var channel_id = evt.d.channel_id; 
      
      if ( !isVoiceChannel(channel_id))
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
            sendMessage(channel_id, "Sorry, "+bondage.bound_to_username+" is my master today. Get them to release me from my bonds and I'll serve you.");
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
          bondage.release();
          sendMessage(channel_id, "Goodbye master");
        }
        else
          sendMessage(channel_id, "I have no master... would you like to be my master?");
        break;
        
      case '!':
        bondage.shutup();
        break;
        
      case 'leave':
        bondage.leaveVoiceChannel();
        break;
    }
  }
  else { // tts that
    if ( message.length > 199 ) return;
    if ( bondage.isMaster(user_id) && bondage.inChannel() ) {
      tts(message, 'en', 1).then(function(url) {
        console.log(url);
        bot.getAudioContext(bondage.current_voice_channel_id, function(error, stream) {
          if ( error) return console.error(error);
          request
            .get(url)
            .on('end', function() {console.log("Done : " + url);})
            .pipe(stream, {end:false})
            .on('end', function() { console.log('Discord got: ' + url); });
            /* fs.createReadStream('silence.mp3').pipe(stream, {end:false});*/
           
        });
      })
      .catch(function(err) {
        console.error(err.stack);
      });

    }
  }
});

