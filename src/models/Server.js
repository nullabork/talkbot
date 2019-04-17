
var Lang = require("lang.js"),
  paths = require('@paths'),
  commands = require('@commands'),
  botStuff = require('@helpers/bot-stuff'),
  MessageSSML = require('@models/MessageSSML'),
  MessageDetails = require('@models/MessageDetails'),
  Common = require('@helpers/common'),
  langmap = require('@helpers/langmap'),
  auth = require('@auth'),
  bot = botStuff.bot,
  fs = require('fs');

// https://discordapp.com/developers/docs/topics/permissions
var P_ADMINISTRATOR = 0x00000008;
var P_MANAGE_GUILD = 0x00000020;

var TIMEOUT_NEGLECT = 120 * 60 * 1000; // 2 hours

class Server {

  constructor(server_id, world) {
    this.server_id = server_id;

    var inst = bot.servers[this.server_id];
    var state_data = this.loadState() || {};

    this.server_name = inst.name;
    this.server_owner_user_id = inst.owner_id;
    this.users = bot.users[this.server_owner_user_id] || {};
    if (this.users[this.server_owner_user_id])
      this.server_owner_username = this.users[this.server_owner_user_id];

    this.audioEmojis = state_data.audioEmojis || {};
    this.userSettings = state_data.userSettings || {};
    this.textrules = state_data.textrules || { "o\\/": "wave", "\\\\o": "wave ack", "\\\\o\\/": "hooray", "\\(y\\)": "thumbs up", "\\(n\\)": "thumbs down" };
    this.bound_to = null;
    this.bound_to_username = null;
    this.current_voice_channel_id = null;
    this.permitted = {};
    this.neglect_timeout = null;
    this.language = state_data.language || 'en-AU';
    this.fallbackLang = 'en';
    this.created = state_data.created || new Date();
    this.updated = new Date();
    this.world = world;

    this.commandResponses = new Lang({
      messages: require('@src/lang.json'),
      locale: langmap.get(this.language).root,
      fallback: this.fallbackLang
    });

    this.messages = {};
  }

  setMaster(user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
    this.save();
  }

  addSettings(key, add) {
    if (typeof add == 'object' && !this[key]) this[key] = {};
    if (this[key]) {
      this[key] = {
        ...this[key],
        ...add
      }
    }
  }

  addUserSetting(user_id, name, value) {
    if (!this.userSettings) this.userSettings = {};
    if (!this.userSettings[user_id]) {
      this.userSettings[user_id] = {};
    }

    this.userSettings[user_id][name] = value;
    this.save();
    return value;
  }


  clearUserSettings(user_id) {
    if (!this.userSettings) this.userSettings = {};
    this.userSettings[user_id] = {};
    this.save();
  }

  getUserSetting(user_id, name) {
    if (!this.userSettings || !this.userSettings[user_id] || !this.userSettings[user_id][name]) return null;
    return this.userSettings[user_id][name];
  }

  deleteUserSetting(user_id, name) {
    if (!this.userSettings || !this.userSettings[user_id] || !this.userSettings[user_id][name]) return;
    delete this.userSettings[user_id][name];
  }

  getUserSettings(user_id) {
    if (!this.userSettings || !this.userSettings[user_id]) return {};
    return this.userSettings[user_id];
  }

  lang(key, params) {
    if (this.isLangKey(key)) {
      return this.messages[key];
    }
    
    if ( !params ) params = {};

    var command_char = auth.command_char;
    var title = params.title || this.world.default_title;
    
    params = {
      ...(params),
      command_char,
      title 
    }

    return this.commandResponses.get.apply(this.commandResponses, [
      key,
      params
    ]);
  }
  
  isLangKey(possible_key) {
    return this.messages && this.messages[possible_key];
  };

  isServerChannel(channel_id) {
    return bot.channels[channel_id].guild_id == this.server_id;
  }

  getOwnersVoiceChannel(user_id) {
    return botStuff.getUserVoiceChannel(user_id);
  };

  release(callback) {
    var server = this;
    if (server.leaving) return; // dont call it twice dude
    server.leaving = true;
    if (!callback) callback = function(err) {};

    var channel_id = server.current_voice_channel_id;
    bot.leaveVoiceChannel(channel_id, function (err) {
      if ( err) Common.error(err);
      server.bound_to = null;
      server.bound_to_username = null;
      server.permitted = {};
      clearTimeout(server.neglect_timeout);
      server.current_voice_channel_id = null;
      server.leaving = false;
      server.world.setPresence();
      callback();
    });
  };

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
      if (this.roleHasPermission(bot.servers[this.server_id].members[user_id].roles[r], permission_bit)) {
        return true;
      }
    }
    return false;
  };

  // does this server think it's in a voice channel
  inChannel() {
    return this.current_voice_channel_id != null;
  };

  // set the server properties to indicate this is the current voice channel
  setVoiceChannel(channel_id) {
    var server = this;
    server.current_voice_channel_id = channel_id;
    server.save();
    server.world.setPresence();
  }

  // get the server to join a voice channel
  // NOTE: this is async, so if you want to run a continuation use the callback.
  joinVoiceChannel(channel_id, callback) {

    var server = this;
    if (!callback) callback = function () { };
    if (server.current_voice_channel_id == channel_id) return Common.error('joinVoiceChannel(' + channel_id + '): already joined!');
    if (server.connecting) return Common.error('joinVoiceChannel(' + channel_id + '): tried to connect twice!');
    server.connecting = true;

    if (!server.isServerChannel(channel_id)) return Common.error('joinVoiceChannel(' + channel_id + ') on the wrong server');

    bot.joinVoiceChannel(channel_id, function (error, events) {
      if (error) {
        Common.error(error);
        server.connecting = false;
      }
      else {
        server.setVoiceChannel(channel_id);
        server.connecting = false;
        callback();
      }
    });
  };

  // permit another user to speak
  permit(snowflake_id) {    
    this.resetNeglectTimeout();
    this.permitted[snowflake_id] = {};
    this.save();
  };

  // unpermit another user to speak
  unpermit(snowflake_id) {
    this.resetNeglectTimeout();
    this.permitted[snowflake_id] = null;
    this.save();
  };

  // is this user permitted to speak
  isPermitted(user_id) {
    if (!user_id) return false;
    for(var permitted in this.permitted) {
      if ( permitted == user_id ) return this.permitted[permitted] != null;
      if ( botStuff.userHasRole(this.server_id, user_id, permitted)) return this.permitted[permitted] != null;
    }
    return false;
  };

  // reset the timer that unfollows a user if they dont use the bot
  resetNeglectTimeout() {
    var server = this;

    var neglected_timeout = function () {
      server.neglected();
    };

    clearTimeout(server.neglect_timeout);
    server.neglect_timeout = setTimeout(neglected_timeout, TIMEOUT_NEGLECT);
  };

  // called when the neglect timeout expires
  neglected() {
    var server = this;

    // delay for 3 seconds to allow the bot to talk
    var neglectedrelease = function () {
      var timeout_neglectedrelease = function () { 
        Common.out('neglected: in chan');
        server.release(); 
      };
      setTimeout(timeout_neglectedrelease, 3000);
    };

    if (server.inChannel()) {
      server.talk("I feel neglected, I'm leaving", null, neglectedrelease);
    } else {
      Common.out('neglected: server.release() not in chan');
      server.release();
    }
  }


  // speak a message in a voice channel
  talk(message, options, callback) {

    var server = this;
    if (!server.inChannel()) return;
    if (!options) options = {};

    for (var key in options) {
      if (options.hasOwnProperty(key) && options[key] == 'auto') {
        options[key] = 'default';
      }
    }

    var settings = {
      gender: options.gender == 'default' ? 'NEUTRAL' : options.gender,
      language: options.language == 'default' ? 'en-AU' : options.language || server.language
    }

    if (options.name != 'default') settings.name = options.name;
    if (options.pitch != 'default') settings.pitch = options.pitch;
    if (options.speed != 'default') settings.speed = options.speed;

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

    request.input = { text: null, ssml: message };
    
    var channel_id = server.current_voice_channel_id;

    // Performs the Text-to-Speech request
    botStuff.tts().synthesizeSpeech(request, (err, response) => {
      if (err) {
        Common.error(err);
        return;
      }
      try {
        bot.getAudioContext(channel_id, function (error, stream) {
          if (error) {
            Common.error(error);
            return;
          } 
          try {
            stream.write(response.audioContent);
            callback();
          } catch (ex) {
            Common.error(ex);
          }
        });
      }
      catch (e) {
        Common.error(e);
      }
    });
  }

  addTextRule(search_text, replace_text, escape_regex) {
    if (replace_text == '') return;
    if (search_text == '') return;
    search_text = search_text.trim().toLowerCase();
    replace_text = replace_text.trim();
    if (escape_regex) search_text = Common.escapeRegExp(search_text);
    this.textrules[search_text] = replace_text;
    this.save();
  };

  removeTextRule(search_text, escape_regex) {
    search_text = search_text.trim().toLowerCase();
    if (escape_regex) search_text = Common.escapeRegExp(search_text);
    delete this.textrules[search_text];
    this.save();
  };

  removeTextRuleByIndex(index) {
    var i = 0;
    for (var k in Object.keys(this.textrules))
      if (++i == index)
        this.removeTextRule(k);
  };

  clearAllTextRules() {
    this.textrules = {};
    this.save();
  };

  // run this to cleanup resources before shutting down
  shutdown() {

    Common.out("shutdown(): " + (new Error()).stack);
    var server = this;

    if (server.inChannel()) {
      server.talk("The server is shutting down", null, function () {
        server.release();
      });
    }
    else {
      server.release();
    }
  }

  // when the server is deleted or shutdown or disconnected run this to cleanup things
  dispose() {
    this.shutdown();
    clearTimeout(this.neglect_timeout);
  };

  // save the state file
  save(_filename) {
    var self = this;
    this.updated = new Date();
    function replacer(key, value) {
      if (key.endsWith("_timeout")) return undefined; // these keys are internal timers that we dont want to save
      if (key == "commandResponses") return undefined;
      if (key == "world") return undefined;
      else return value;
    };

    if (!_filename) _filename = paths.config + "/" + self.server_id + ".server";
    fs.writeFileSync(_filename, JSON.stringify(self, replacer), 'utf-8');
  };

  // load the state file
  loadState() {
    var self = this;
    var _filename = paths.config + "/" + self.server_id + ".server";

    if (fs.existsSync(_filename)) {
      return JSON.parse(fs.readFileSync(_filename));
    }

    return null;
  };

  // call this if you want to check a message is valid and run it through translation
  speak(message, channel_id, user_id) {

    var server = this;

    if (
      message.length < 1 ||
      Common.isMessageExcluded(message) ||
      !server.inChannel() ||
      !server.isPermitted(user_id)
    ) return;

    message = botStuff.resolveMessageSnowFlakes(channel_id, message);
    message = Common.cleanMessage(message);
    
    var ret = commands.notify('message', { message: message, user_id, server, world: server.world });
    if (ret) message = ret;

    function _speak(msg) {
      var message = new MessageSSML(msg, { server: server }).build();
      var settings = server.getUserSettings(user_id);
      server.talk(message, settings);
    }

    var tolang = server.getUserSetting(user_id, 'toLanguage');
    if (tolang && !tolang == "default") {

      botStuff.translate_client
        .translate(message, tolang)
        .then(results => {
          _speak(results[0]);
        })
        .catch(err => {
          Common.error(err);
        });
    } else {
      _speak(message);
    };
  };

};

module.exports = Server;
