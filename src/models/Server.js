
var botStuff = require('../helpers/bot-stuff'),
  world = require('../models/World'),
  bot = botStuff.bot;

class Server {

  constructor(server_id, server_data) {
    
    this.server_id = server_id;
    this.inst = bot.servers[server_id];
    this.server_name = this.inst.name;
    this.server_owner_user_id = this.inst.owner_id;
    this.users = bot.users[this.server_owner_user_id];    
    this.server_owner_username = this.users[this.server_owner_user_id];
   
    this.bound_to = null;
    this.bound_to_username = null;
    this.current_voice_channel_id = null;
    this.permitted = {};
    this.neglect_timeout = null;
    this.neglect_neglect = null;
    this.language = 'en';
    this.messages = {};

    if (server_data) {
      Object.assign(this, client_data);
    }
  }

  setMaster (user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
  };

  init () {
    if (this.isBound()) {
      this.setMaster(this.bound_to, this.bound_to_username);
    }
    else {
      // inits empty
      this.release();
    }

    var voiceChan = botStuff.getUserVoiceChannel(this.bound_to);
    if (voiceChan) {
      if (!this.isServerChannel(voiceChan))
        this.leaveVoiceChannel();
      else
        this.joinVoiceChannel(voiceChan);
    }
  }

  lang (key) {
    if (this.messages && this.messages[key]) {
      return this.messages[key];
    }
    return lang.get.apply(lang, Array.from(arguments));
  }

 setMaster (user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
    world.save();
  }

  isServerChannel (channel_id) {
    return bot.channels[channel_id].guild_id == this.server_id;
  }

  getOwnersVoiceChannel (user_id) {
    return botStuff.getUserVoiceChannel(user_id);
  };

  release () {
    this.bound_to = null;
    this.bound_to_username = null;
    this.permitted = {};
    clearTimeout(this.neglect_timeout);
    this.neglect_timeout = null;
    if (this.inChannel()) {
      this.leaveVoiceChannel();
    }

    world.save();
  };

  getChannelMembers (channel_id) {
    if (!bot.channels[channel_id]
      && !bot.servers[bot.channels[channel_id].guild_id]
      && bot.servers[bot.channels[channel_id].guild_id].members) {
      return bot.servers[bot.channels[channel_id].guild_id].members;
    }
    return null;
  }

  kill () {
    world.save();
    bot.disconnect();
    process.exit();
  }

  isMaster (user_id) {
    if (!user_id) return false;
    return this.bound_to == user_id;
  };

  isBound () {
    return this.bound_to != null;
  };

  getBoundToNick () {
    var channel_id = botStuff.getUserVoiceChannel(this.bound_to);
    
    if (!this.bound_to || !channel_id) {
      return null;
    }

    if (channel_id && this.bound_to) {
      return botStuff.findThingsName(channel_id, this.bound_to);
    }

    if (this.bound_to_username) {
      return this.bound_to_username;
    }
    
    return this.bound_to;
  };

  inChannel () {
    return this.current_voice_channel_id != null;
  };

  isPermitted (user_id) {
    if (!user_id) return false;
    return this.permitted[user_id] != null;
  };

 joinVoiceChannel (channel_id, callback) {
    var server = this;
    if (!server.isServerChannel(channel_id)) {
      console.log("joinVoiceChannel() on the wrong server");
      return;
    }

    if (!callback) callback = function () { };
    bot.joinVoiceChannel(channel_id, function (error, events) {
      if (error) {
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

  leaveVoiceChannel (callback) {
    if (!callback) callback = function () { };

    // HACK: delay the timeout as the callback sometimes runs before the state = left
    var callback_timeout = function () {
      setTimeout(callback, 2000);
    };

    if (this.current_voice_channel_id != null){
      bot.leaveVoiceChannel(this.current_voice_channel_id, callback_timeout);
    }

    this.current_voice_channel_id = null;
    world.save();
  }

  permit (user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = {};
    world.save();
  }

  unpermit (user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = null;
    world.save();
  }

  resetNeglectTimeout () {
    var server = this;

    if (server.neglect_neglect) {
      clearTimeout(server.neglect_timeout);
      server.neglect_timeout = null;
    }
    else {
      var neglected_timeout = function () {
        server.neglected();
      };

      clearTimeout(server.neglect_timeout);
      server.neglect_timeout = setTimeout(neglected_timeout, world.NEGLECT_TIMEOUT_IN_MS);
    }
  };

  talk (message, options, callback) {
    this.resetNeglectTimeout();
    var server = this;
    var play_padding = (message.length < 20);
    if (!callback) callback = function () { };

    var request = {
      input: { text: message },
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

    //if ( options.use_ssml )
    request.input = { text: null, ssml: message };


    // Performs the Text-to-Speech request
    tts_client.synthesizeSpeech(request, (err, response) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      bot.getAudioContext(server.current_voice_channel_id, function (error, stream) {
        if (error) return console.error(error);

        try {
          stream.write(response.audioContent);
        }
        catch (ex) {
          console.error(ex);
        }
      });


    });

  }

  neglected () {
    var server = this;

    if (server.neglect_neglect) return;
    // delay for 3 seconds to allow the bot to talk
    var neglectedrelease = function () {
      var timeout_neglectedrelease = function () { server.release(); };
      setTimeout(timeout_neglectedrelease, 3000);
    };

    if (server.inChannel())
      server._talk("I feel neglected, I'm leaving", server, neglectedrelease);
    else
      server.release();
  }

  toggleNeglect () {
    this.neglect_neglect = !this.neglect_neglect;
    return this.neglect_neglect;
  }

  setNicks (channel_id, tokens) {

    var i = 0;

    if (bot.servers[this.server_id] == null) { console.log('no server'); return; }
    if (bot.servers[this.server_id].channels[channel_id] == null) {

      for (var chan in bot.servers[this.server_id].channels)
        console.log(bot.servers[this.server_id].channels[chan]);
      return;
    }

    for (var member in bot.servers[this.server_id].channels[channel_id].members) {
      if (args.length - 3 <= i) return;
      bot.editNickname({
        serverID: this.server_id,
        userID: member,
        nick: tokens[i++] + ' ' + tokens[i++] + ' ' + tokens[i++],
      });
    }

  };

 playAudioFile (filename, callback) {
    if (!callback) callback = function () { };
    bot.getAudioContext(this.current_voice_channel_id, function (error, stream) {
      if (error) return console.error(error);

      try {
        fs.createReadStream(filename)
          .on('end', callback)
          .pipe(stream, { end: false })
          .on('error', function (err) {
            console.error('Error writing to discord voice stream. ' + err);
          });
      }
      catch (ex) {
        console.error(ex);
      }
    });
  };

}

module.exports = Server;