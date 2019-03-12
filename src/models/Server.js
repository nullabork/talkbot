
var Lang = require("lang.js"),
  paths = require('@paths'),
  commands = require('@commands'),
  botStuff = require('@helpers/bot-stuff'),
  MessageSSML = require('@models/MessageSSML'),
  MessageDetails = require('@models/MessageDetails'),
  Common = require('@helpers/common'),
  langmap = require('@helpers/langmap'),
  auth = require('@auth'),
  bot = botStuff.bot;

var fs = require('fs');

// https://discordapp.com/developers/docs/topics/permissions
var P_ADMINISTRATOR  = 0x00000008;
var P_MANAGE_GUILD   = 0x00000020;

var TIMEOUT_LEAVEVOICE = 30000; // 30 seconds
var TIMEOUT_NEGLECT    = 120 * 60 * 1000; // 2 hours

  // MESSAGE_AVERAGE_TIMEFRAME_MS = 60000,
  // MESSAGE_TIMEFRAME_RETENTION_MS = MESSAGE_AVERAGE_TIMEFRAME_MS * 5,
  // MESSAGE_AVERAGE_THRESHOLD = 60;


class Server {

  constructor(server_id) {
    this.server_id = server_id;

    var inst = bot.servers[this.server_id];
    var state_data = this.loadState() || {};


    //this.owner_id = inst.owner_id;
    this.server_name = inst.name;
    this.server_owner_user_id = inst.owner_id;
    this.users = bot.users[this.server_owner_user_id] || {};
    if ( this.users[this.server_owner_user_id])
      this.server_owner_username = this.users[this.server_owner_user_id];

    this.audioEmojis = state_data.audioEmojis || {};
    this.userSettings = state_data.userSettings || {};
    this.textrules = state_data.textrules || {"o\\/": "wave", "\\\\o": "wave ack", "\\\\o\\/": "hooray", "\\(y\\)": "thumbs up", "\\(n\\)": "thumbs down"};
    this.bound_to = state_data.bound_to;
    this.bound_to_username = state_data.bound_to_username;
    this.current_voice_channel_id = state_data.current_voice_channel_id;
    this.permitted = {};
    this.neglect_timeout = null;
    this.neglect_neglect = null;
    this.language = state_data.language || 'en-AU';
    this.fallbackLang = 'en';
    this.created = state_data.created  || new Date();
    this.updated = new Date();

    this.commandResponses = new Lang({
      messages: require('@src/lang.json'),
      locale: langmap.get(this.language).root,
      fallback: this.fallbackLang
    });

    this.messages = {};
  }
  
  rejoinVoiceChannel() {
    if (!this.bound_to) return;
    this.setMaster(this.bound_to, this.bound_to_username);
    var chan_id = this.current_voice_channel_id; // to get around the guard condition
    this.current_voice_channel_id = null;
    if (botStuff.getUserVoiceChannel(this.bound_to) == chan_id)
      this.joinVoiceChannel(chan_id);
  };

  setMaster(user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
  };

  addSettings(key, add){
    if(typeof add == 'object' && !this[key]) this[key] = {};
    if(this[key]) {
      this[key] = {
        ...this[key],
        ...add
      }
    }
  }

  addUserSetting(user_id, name, value) {
    if(!this.userSettings) this.userSettings = {};
    if(!this.userSettings[user_id]) {
      this.userSettings[user_id] = {};
    }

    this.userSettings[user_id][name] = value;
    this.save();
    return value;
  }


  clearUserSettings(user_id) {
    if(!this.userSettings) this.userSettings = {};
    this.userSettings[user_id] = {};
    this.save();
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

  lang(key, params) {
    if (this.messages && this.messages[key]) {
      return this.messages[key];
    }

    var command_char = auth.command_char;

    params = {
      ...(params||{}),
      command_char
    }

    return this.commandResponses.get.apply(this.commandResponses, [
      key,
      params
    ]);
  }

  setMaster(user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
    this.save();
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

    this.leaveVoiceChannel();
  };

  getChannelMembers(channel_id) {
    if (!bot.channels[channel_id]
      && !bot.servers[bot.channels[channel_id].guild_id]
      && bot.servers[bot.channels[channel_id].guild_id].members) {
      return bot.servers[bot.channels[channel_id].guild_id].members;
    }
    return null;
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

  setVoiceChannel(channel_id) {
    var server = this;
    server.cancelUnfollowTimer();
    server.current_voice_channel_id = channel_id;
    server.save();
    var w = require("./World");
    w.setPresence();
  }

  joinVoiceChannel(channel_id, callback) {

    if (!callback) callback = function () { };
    var server = this;
    if (server.current_voice_channel_id == channel_id) return;

    if (!server.isServerChannel(channel_id)) {
      Common.error("joinVoiceChannel() on the wrong server");
      return;
    }

    bot.joinVoiceChannel(channel_id, function (error, events) {
      if (error) {
        Common.error(error);
      }
      else {
        server.setVoiceChannel(channel_id);
        var w = require("./World");
        w.incrementStatDailyActiveServers(server.server_id);
        callback();
      }
    });
  };

  leaveVoiceChannel(callback) {
    var server = this;
    if (!callback) callback = function () { };

    // HACK: delay the timeout as the callback sometimes runs before the state = left
    var callback_timeout = function () {
      setTimeout(callback, 100);
    };

    if (server.current_voice_channel_id != null) {
      bot.leaveVoiceChannel(server.current_voice_channel_id, callback_timeout);
    }

    server.current_voice_channel_id = null;
    this.save();
    var w = require("./World");
    w.setPresence();
  };
  
  // leave the current voice channel and join another
  switchVoiceChannel(channel_id, callback) {
    var server = this;
        
    server.leaveVoiceChannel(function() {
      server.joinVoiceChannel(channel_id, callback);
    });
  };
  
  

  permit(user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = {};
    this.save();
  }

  unpermit(user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = null;
    this.save();
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
    if (!server.inChannel()) return;
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

    server.resetNeglectTimeout();

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
      try {
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
      }
      catch(e)
      {
        if ( e.message.startsWith('You have not joined the voice channel'))
        {
          Common.error("Caught a bad voice channel");
          var chan_id = server.current_voice_channel_id;
          server.leaveVoiceChannel(function() { server.joinVoiceChannel(chan_id); });
        }
      }
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

  addTextRule(search_text, replace_text, escape_regex) {
    if ( replace_text == '' ) return;
    if ( search_text == '' ) return;
    search_text = search_text.trim().toLowerCase();
    replace_text = replace_text.trim();
    if ( escape_regex ) search_text = Common.escapeRegExp(search_text);
    this.textrules[search_text] = replace_text;
    this.save();
  };

  removeTextRule(search_text, escape_regex) {
    search_text = search_text.trim().toLowerCase();
    if ( escape_regex ) search_text = Common.escapeRegExp(search_text);
    delete this.textrules[search_text];
    this.save();
  };

  removeTextRuleByIndex(index) {
    var i = 0;
    for( var k in Object.keys(this.textrules))
      if ( ++i == index )
        this.removeTextRule(k);
  };

  clearAllTextRules() {
    this.textrules = {};
    this.save();
  };

  startUnfollowTimer() {
    var server = this;
    var unfollow_timeout = function() {
      server.release();
      server.unfollow_timeout = null;
      server.save();
      var w = require("./World");
      w.setPresence();
    };

    server.unfollow_timeout = setTimeout(unfollow_timeout, TIMEOUT_LEAVEVOICE);
  };

  cancelUnfollowTimer() {
    if (this.unfollow_timeout)
      clearTimeout(this.unfollow_timeout);
    this.unfollow_timeout = null;
  };
  
  dispose() {
    clearTimeout(this.neglect_timeout);
  };

  save(_filename) {
    var self  = this;
    this.updated = new Date();
    function replacer(key, value) {
      if (key.endsWith("_timeout")) return undefined; // these keys are internal timers that we dont want to save
      if (key == "commandResponses") return undefined;
      else return value;
    };

    if ( !_filename) _filename = paths.config + "/" + self.server_id + ".server";
    fs.writeFileSync(_filename, JSON.stringify(self, replacer), 'utf-8');
  };

  loadState() {

    var self = this;
    var _filename = paths.config + "/" + self.server_id + ".server";

    if (fs.existsSync(_filename)) {
      return JSON.parse(fs.readFileSync(_filename));
    }

    return null;
  };
  
  speak(message, channel_id, user_id, world) {
    
    var server = this;
    
    if (
      message.length < 1 ||
      Common.isMessageExcluded(message) ||
      !server.inChannel() ||
      !server.isPermitted(user_id)
    ) return;

    var ret = commands.notify('message', {message : message, user_id, server, world});
    if (ret) message = ret;

    message = botStuff.resolveMessageSnowFlakes(channel_id, message);
    message = Common.cleanMessage(message);

    function _speak(msg) {
      var message = new MessageSSML(msg, { server: server }).build();
      var settings = server.getUserSettings(user_id);
      server.talk(message, settings);
    }

    var tolang = server.getUserSetting(user_id, 'toLanguage');
    if (tolang && !tolang == "default") {

      botStuff.translate_client
        .translate(message, tolang)
        .then( results => {
          _speak(results[0]);
        })
        .catch(err => {
          Common.error( err );
        });
    } else {
      _speak(message);
    };
  };

};

module.exports = Server;
