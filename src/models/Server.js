
var Lang = require("lang.js"),
  botStuff = require('@helpers/bot-stuff'),
  Common = require('@helpers/common'),
  langmap = require('@helpers/langmap'),
  bot = botStuff.bot;

// https://discordapp.com/developers/docs/topics/permissions
var P_ADMINISTRATOR  = 0x00000008;
var P_MANAGE_GUILD   = 0x00000020;

var TIMEOUT_LEAVEVOICE = 30000; // 30 seconds
var TIMEOUT_NEGLECT    = 120 * 60 * 1000; // 2 hours

  // MESSAGE_AVERAGE_TIMEFRAME_MS = 60000,
  // MESSAGE_TIMEFRAME_RETENTION_MS = MESSAGE_AVERAGE_TIMEFRAME_MS * 5,
  // MESSAGE_AVERAGE_THRESHOLD = 60;


class Server {

  constructor(server_data, server_id, state_data) {
    state_data = state_data || {};
    this.server_id = server_id;
    if (!this.server_id && server_data.id) {
      this.server_id = server_data.id;
    }

    var inst = bot.servers[this.server_id];


    //this.owner_id = inst.owner_id;
    this.server_name = inst.name;
    this.server_owner_user_id = inst.owner_id;
    this.users = bot.users[this.server_owner_user_id] || {};
    if ( this.users[this.server_owner_user_id])
      this.server_owner_username = this.users[this.server_owner_user_id].username;

    this.audioEmojis = state_data.audioEmojis || server_data.audioEmojis || {};
    this.userSettings = state_data.userSettings || server_data.userSettings || {};
    this.textrules = state_data.textrules || server_data.textrules || {};
    this.bound_to = null;
    this.bound_to_username = null;
    this.current_voice_channel_id = null;
    this.permitted = {};
    this.neglect_timeout = null;
    this.neglect_neglect = null;
    this.language = state_data.language || server_data.language || 'en-AU';
    this.fallbackLang = 'en';
    // this.messagesPerMinute = [];
    this.created = state_data.created || server_data.created || new Date();

    this.commandResponses = new Lang({
      messages: require('@src/lang.json'),
      locale: langmap.get(this.language).root,
      fallback: this.fallbackLang //langmap.get(this.fallbackLang).root
    });

    this.messages = {};
  }

  // setMessagesPerMinute () {
  //   var msgTime = new Date().getTime(),
  //     thresholdTime = msgTime - MESSAGE_TIMEFRAME_RETENTION_MS;
  //   this.messagesPerMinute.unshift(msgTime);

  //   let i = this.messagesPerMinute.length;
  //   while(i--){
  //     var time = array[i];
  //     if(time <= thresholdTime) {
  //       this.messagesPerMinute.splice(-1,1);
  //     } else {
  //       break;
  //     }
  //   }
  // }

  // getMessageAverage() {
  //   var totals = [],
  //   msgTime = new Date().getTime(),
  //   thresholdTime = msgTime - MESSAGE_AVERAGE_TIMEFRAME_MS;
  //   var total = 0;
  //   for (let msgTime of this.messagesPerMinute) {
  //     if(msgTime > thresholdTime){
  //       total++;
  //     } else {
  //       thresholdTime -= MESSAGE_AVERAGE_TIMEFRAME_MS;
  //       totals.push(total);
  //       total = 0;
  //     }
  //   }
  // }

  setMaster(user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
  };

  addUserSetting(user_id, name, value) {
    if(!this.userSettings) this.userSettings = {};
    if(!this.userSettings[user_id]) {
      this.userSettings[user_id] = {};
    }

    this.userSettings[user_id][name] = value;
    require('./World').save();
    return value;
  }


  clearUserSettings(user_id) {
    if(!this.userSettings) this.userSettings = {};
    this.userSettings[user_id] = {};
    require('./World').save();
  }


  getUserSetting(user_id, name) {
    if(!this.userSettings || !this.userSettings[user_id] || !this.userSettings[user_id][name]) return null;
    return this.userSettings[user_id][name];
  }

  deleteUserSetting(user_id, name) {
    if(!this.userSettings || !this.userSettings[user_id] || !this.userSettings[user_id][name]) return;
    delete this.userSettings[user_id][name];
  }

  getUserSettings(user_id) {
    if(!this.userSettings || !this.userSettings[user_id]) return {};
    return this.userSettings[user_id];
  }

  sendMessageToOwner(message) {
    if (this.server_owner_user_id) {
      bot.sendMessage({
        to: this.server_owner_user_id,
        message: message
      });
    }
  }

  init() {
    if (this.isBound()) {
      this.setMaster(this.bound_to, this.bound_to_username);
    } else {
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

  lang(key) {
    if (this.messages && this.messages[key]) {
      return this.messages[key];
    }
    return this.commandResponses.get.apply(this.commandResponses, Array.from(arguments));
  }

  setMaster(user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
    require('./World').save();
  }

  isServerChannel(channel_id) {
    return bot.channels[channel_id].guild_id == this.server_id;
  }

  getOwnersVoiceChannel(user_id) {
    return botStuff.getUserVoiceChannel(user_id);
  };

  release() {
    this.bound_to = null;
    this.bound_to_username = null;
    this.permitted = {};
    clearTimeout(this.neglect_timeout);

    if (this.inChannel()) {
      this.leaveVoiceChannel();
    }

    require('./World').save();
  };

  getChannelMembers(channel_id) {
    if (!bot.channels[channel_id]
      && !bot.servers[bot.channels[channel_id].guild_id]
      && bot.servers[bot.channels[channel_id].guild_id].members) {
      return bot.servers[bot.channels[channel_id].guild_id].members;
    }
    return null;
  }

  kill() {
    require('./World').save();
    bot.disconnect();
    process.exit();
  }

  isMaster(user_id) {
    if (!user_id) return false;
    return this.bound_to == user_id;
  };

  isBound() {
    return this.bound_to != null;
  };

  getBoundToNick() {
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

  // determines if the user can manage this server
  canManageTheServer(user_id) {
    return this.userHasPermissions(user_id, P_ADMINISTRATOR) ||
           this.userHasPermissions(user_id, P_MANAGE_GUILD) ||
           this.isServerOwner(user_id);
  }

  // see the constants up top
  roleHasPermission(role_id, permission_bit) {
    if (bot.servers[this.server_id].roles[role_id] == null) return false;
    if (bot.servers[this.server_id].roles[role_id]._permissions & permission_bit) return true;
    else return false;
  };

  isServerOwner(user_id) {
    return bot.servers[this.server_id].owner_id == user_id;
  };

  // determine if user has the biggest permissions available
  userHasPermissions(user_id, permission_bit) {
    for (var r in bot.servers[this.server_id].members[user_id].roles) {
      if (this.roleHasPermission(bot.servers[this.server_id].members[user_id].roles[r], permission_bit )) {
        return true;
      }
    }
    return false;
  };

  inChannel() {
    return this.current_voice_channel_id != null;
  };

  isPermitted(user_id) {
    if (!user_id) return false;
    return this.permitted[user_id] != null;
  };

  joinVoiceChannel(channel_id, callback) {
    var server = this;
    if (!server.isServerChannel(channel_id)) {
      Common.out("joinVoiceChannel() on the wrong server");
      return;
    }

    server.cancelUnfollowTimer();
    if (!callback) callback = function () { };
    bot.joinVoiceChannel(channel_id, function (error, events) {
      if (error) {
        Common.error(error);
      }
      else {
        server.current_voice_channel_id = channel_id;
        Common.out('joined channel: ' + channel_id);
        callback();
      }

      var w = require('./World');
      w.save();
      w.setPresence();
    });
  };

  leaveVoiceChannel(callback) {
    var server = this;
    if (!callback) callback = function () { };

    // HACK: delay the timeout as the callback sometimes runs before the state = left
    var callback_timeout = function () {
      setTimeout(callback, 2000);
    };

    if (server.current_voice_channel_id != null) {
      bot.leaveVoiceChannel(server.current_voice_channel_id, callback_timeout);
    }

    server.current_voice_channel_id = null;
    var w = require('./World');
    w.save();
    w.setPresence();
  }

  permit(user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = {};
    require('./World').save();
  }

  unpermit(user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = null;
    require('./World').save();
  }

  resetNeglectTimeout() {
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
      server.neglect_timeout = setTimeout(neglected_timeout, TIMEOUT_NEGLECT);
    }
  };

  talk(message, options, callback) {

    var server = this;
    if(!options) options = {};

    for (var key in options) {
      if(options.hasOwnProperty(key) && options[key] == 'auto'){
        options[key] = 'default';
      }
    }

    var settings = {
      gender : options.gender == 'default' ? 'NEUTRAL' : options.gender,
      language : options.language == 'default' ? 'en-AU' : options.language || server.language
    }

    if(options.name != 'default') settings.name = options.name;
    if(options.pitch != 'default') settings.pitch = options.pitch;
    if(options.speed != 'default') settings.speed = options.speed;


    //if(settings.language == 'default') delete settings['name'];

    this.resetNeglectTimeout();

    var play_padding = (message.length < 20);
    if (!callback) callback = function () { };

    var request = {
      input: { text: message },
      // Select the language and SSML Voice Gender (optional)
      voice: {
        languageCode: settings.language || '',
        ssmlGender: settings.gender || 'NEUTRAL',
        name: settings.name || ''
      },
      // Select the type of audio encoding
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: settings.pitch || 0.0,
        speakingRate: settings.speed || 1.0
      },
    };

    //if(settings.name) delete request.voice['languageCode'];

    //if ( options.use_ssml )
    request.input = { text: null, ssml: message };

    // Performs the Text-to-Speech request
    botStuff.tts().synthesizeSpeech(request, (err, response) => {
      if (err) {
        Common.error(err);
        callback();
        return;
      }
      bot.getAudioContext(server.current_voice_channel_id, function (error, stream) {
        if (error) {
          callback();
          return Common.error(error);
        } try {
          stream.write(response.audioContent);
          callback();
        } catch (ex) {
          Common.error(ex);
        }
      });
    });
  }

  neglected() {
    var server = this;

    if (server.neglect_neglect) return;
    // delay for 3 seconds to allow the bot to talk
    var neglectedrelease = function () {
      var timeout_neglectedrelease = function () { server.release(); };
      setTimeout(timeout_neglectedrelease, 3000);
    };

    if (server.inChannel()) {
      server.talk("I feel neglected, I'm leaving", null, neglectedrelease);
    } else {
      server.release();
    }
  }

  toggleNeglect() {
    var server = this;
    server.neglect_neglect = !server.neglect_neglect;
    server.resetNeglectTimeout();
    return this.neglect_neglect;
  }

  addTextRule(search_text, replace_text) {
    if ( replace_text == '' ) return;
    if ( search_text == '' ) return;
    this.textrules[search_text.trim().toLowerCase()] = replace_text.trim();
    require('./World').save();
  };

  removeTextRule(search_text) {
    delete this.textrules[search_text.trim().toLowerCase()];
    require('./World').save();
  };

  removeTextRuleByIndex(index) {
    var i = 0;
    for( var k in Object.keys(this.textrules))
      if ( ++i == index )
        this.removeTextRule(k);
  };

  clearAllTextRules() {
    this.textrules = {};
    require('./World').save();
  };

  startUnfollowTimer() {
    var server = this;
    var unfollow_timeout = function() {
      server.release();
      server.unfollow_timeout = null;
      var w = require('./World');
      w.save();
      w.setPresence();
    };

    server.unfollow_timeout = setTimeout(unfollow_timeout, TIMEOUT_LEAVEVOICE);
  };

  cancelUnfollowTimer() {
    if (this.unfollow_timeout)
      clearTimeout(this.unfollow_timeout);
    this.unfollow_timeout = null;
  };
}

module.exports = Server;
