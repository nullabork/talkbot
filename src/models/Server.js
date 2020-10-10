/*jshint esversion: 9 */

const Lang = require("lang.js"),
  paths = require("@paths"),
  commands = require("@commands"),
  botStuff = require("@helpers/bot-stuff"),
  Common = require("@helpers/common"),
  fs = require("fs"),
  TextToSpeechService = require("@services/TextToSpeechService");

const TIMEOUT_NEGLECT = 480 * 60 * 1000; // 2 hours

class Server {
  // create the server object
  constructor(guild, world) {
    // the id of this server, note this needs to be before loadState();
    this.server_id = guild.id;

    // get the state file from the disk
    var state_data = this.loadState() || {};

    // name of the server
    this.server_name = guild.name;

    // a list of the audioEmojis for !sfx command
    this.audioEmojis = state_data.audioEmojis || {};

    // general member settings, used in quite a few commands
    this.memberSettings =
      state_data.memberSettings || state_data.userSettings || {};

    // list of text rules for !textrule, default settings as well
    this.textrules = state_data.textrules || {
      "o\\/": "wave",
      "\\\\o": "wave ack",
      "\\\\o\\/": "hooray",
      "\\(y\\)": "thumbs up",
      "\\(n\\)": "thumbs down",
    };

    // set if the server is bound to a master
    this.bound_to = null;

    // when bound this will include the master, !permit to add others
    this.permitted = {};

    // created to timeout the !follow if the bot is not used
    this.neglect_timeout = null;

    // default provider for voices
    this.defaultProvider = state_data.defaultProvider || "";

    // language of the server
    this.language = state_data.language || "en-AU";

    // what role can admin this server
    this.adminrole = state_data.adminrole || "";

    // restrict talkbot to a specific server
    this.restrictions = state_data.restrictions || [];

    // queue for !keep
    this.keepMessages = state_data.keepMessages || {};

    // statistics on this server
    this.stats = state_data.stats || {};

    // when was the server originally created
    this.created = state_data.created || new Date();

    // command char override for this server
    this.command_char = state_data.command_char;

    // when was this server last created in memory
    this.updated = new Date();

    // max number of chars this server can speak - to avoid spamming the APIs
    this.charLimit = state_data.charLimit || 100000;

    // a reference to the world object
    this.world = world;

    // a reference to the discord js guild object
    this.guild = guild;

    // idk?
    this.fallbackLang = "en";

    // access the lang file
    this.commandResponses = new Lang({
      messages: require("@src/lang.json"),
      locale: TextToSpeechService.getVoiceRecords(this.language)[0].translate, // switch the locale to the one they use for translate
      fallback: (this.fallbackLang = "en"),
    });

    // idk??
    this.messages = {};
  }

  // GuildMember
  setMaster(member) {
    this.bound_to = member;
    this.permit(member.id);
    this.resetNeglectTimeout();
    this.save();
  }

  /**
   * Merges or creates the `add` object  passed in, on to `this` scope using the `key` ad the key
   *
   * @param   {[type]}  key  name to add merge and create `add` against
   * @param   {[type]}  add  object to merge or create
   *
   * @return  {[void]}
   */
  addSettings(key, add) {
    if (typeof add == "object" && !this[key]) this[key] = {};
    if (this[key]) {
      this[key] = {
        ...this[key],
        ...add,
      };
    }
  }

  deleteSettings(key) {
    delete this[key];
  }

  getSettingObject(name) {
    if (!this[name] || typeof this[name] !== "object") return {};
    return this[name];
  }

  getSettingObjectValue(objName, valueKey) {
    let object = this.getSettingObject(objName);
    if (typeof object[valueKey] == "undefined") return null;
    return object[valueKey];
  }

  addMemberSetting(member, name, value) {
    if (!member) return;
    if (!this.memberSettings) this.memberSettings = {};
    if (!this.memberSettings[member.id]) {
      this.memberSettings[member.id] = {};
    }

    this.memberSettings[member.id][name] = value;
    this.save();
    return value;
  }

  clearMemberSettings(member) {
    if (!member) return;
    if (!this.memberSettings) this.memberSettings = {};
    this.memberSettings[member.id] = {};
    this.save();
  }

  getMemberSetting(member, name) {
    if (!member) return null;
    if (
      !this.memberSettings ||
      !this.memberSettings[member.id] ||
      !this.memberSettings[member.id][name]
    )
      return null;
    return this.memberSettings[member.id][name];
  }

  deleteMemberSetting(member, name) {
    if (!member) return;
    if (
      !this.memberSettings ||
      !this.memberSettings[member.id] ||
      !this.memberSettings[member.id][name]
    )
      return;
    delete this.memberSettings[member.id][name];
  }

  getMemberSettings(member) {
    if (!member) return {};
    if (!this.memberSettings || !this.memberSettings[member.id]) return {};
    return this.memberSettings[member.id];
  }

  lang(key, params) {
    if (this.isLangKey(key)) {
      return this.messages[key];
    }

    if (!params) params = {};

    var command_char = commands.getCommandChar(this);
    var title = params.title || this.world.default_title;

    params = {
      ...params,
      command_char,
      title,
    };

    return this.commandResponses.get.apply(this.commandResponses, [
      key,
      params,
    ]);
  }

  isLangKey(possible_key) {
    return this.messages && this.messages[possible_key];
  }

  // GuildMember
  isMaster(member) {
    if (!member) return false;
    if (!this.bound_to) return false;
    return this.bound_to.id == member.id;
  }

  // true if this server is bound to a user already
  isBound() {
    return this.bound_to != null;
  }

  // does this server think it's in a voice channel
  inChannel() {
    return this.guild.voice != null && this.guild.voice.connection != null;
  }

  release(callback) {
    const server = this;
    if (!server.guild.voice.connection) return;
    if (server.leaving) return; // dont call it twice dude
    if (callback) server.guild.voice.connection.on("disconnect", callback);
    commands.notify("leaveVoice", { server: server });
    server.guild.voice.connection.disconnect();
  }

  // get the server to join a voice channel
  // NOTE: this is async, so if you want to run a continuation use .then on the promise returned
  joinVoiceChannel(voiceChannel) {
    var server = this;
    if (server.connecting)
      return Common.error(
        "joinVoiceChannel(" + voiceChannel.id + "): tried to connect twice!"
      );
    if (server.inChannel())
      return Common.error(
        "joinVoiceChannel(" +
          voiceChannel.id +
          "): already joined to " +
          server.guild.voice.connection.channel.id +
          "!"
      );
    server.connecting = true;

    // join the voice channel and setup all the listeners to deal with events
    var p = voiceChannel.join().then(
      (connection) => {
        // success

        // when closing stop the voices and clear the neglect timeout
        connection.on("closing", () => {
          server.leaving = true;
          server.stop("voiceClosing"); // stop playing
          clearTimeout(server.neglect_timeout);
        });

        // when disconnect clear the master - note that d/c may happen without a closing event
        connection.on("disconnect", () => {
          server.stop("disconnect"); // stop playing
          server.bound_to = null;
          server.permitted = {};
          server.leaving = false;
        });

        // if an error occurs treat it like a d/c but capture the error
        // reset the state to as if there was no connection
        connection.on("error", (error) => {
          server.bound_to = null;
          server.permitted = {};
          server.leaving = false;
          server.connecting = false; // this might cause a race condition
          Common.error(error);
          connection.disconnect(); // nerf the connection because we got an error
        });

        server.connecting = false;
        server.save();
        server.world.setPresence();
        commands.notify("joinVoice", { server: server });
      },
      (error) => {
        // on an error treat it like a error on the connection
        server.stop("joinError");
        server.bound_to = null;
        server.permitted = {};
        server.connecting = false;
        Common.error(error);
      }
    );

    return p;
  }

  // switch from whatever the current voice channel is to this voice channel
  switchVoiceChannel(voiceChannel) {
    var server = this;
    if (!voiceChannel)
      return Common.error(new Error("null voiceChannel passed"));
    if (!server.guild.voice.connection)
      return server
        .joinVoiceChannel(voiceChannel)
        .then(null, Common.error)
        .catch(Common.error);
    if (voiceChannel.id == server.guild.voice.connection.channel.id)
      return Common.error("voiceChannel already joined");

    server.guild.voice.connection.updateChannel(voiceChannel);
  }

  // permit another user to speak
  permit(snowflake_id) {
    this.resetNeglectTimeout(); // this is redundant, its run from the command as well
    var member = this.guild.members.cache.find(
      (member) => member.id == snowflake_id
    );
    if (member) this.addMemberSetting(member, "toLanguage", "default");
    this.permitted[snowflake_id] = true;
    this.save();
  }

  // unpermit another user to speak
  unpermit(snowflake_id) {
    this.resetNeglectTimeout(); // this is redundant, its run from the command as well
    this.permitted[snowflake_id] = false;
    this.save();
  }

  // is this user permitted to speak
  isPermitted(member) {
    if (!member) return false;
    if (this.permitted[member.id] === false) return false;

    for (var snowflake_id in this.permitted) {
      if (this.permitted[snowflake_id])
        if (snowflake_id == member.id || member.roles.cache.has(snowflake_id))
          return true;
    }
    return false;
  }

  // reset the timer that unfollows a user if they dont use the bot
  resetNeglectTimeout() {
    var server = this;

    var neglected_timeout = function () {
      server.neglected();
    };

    clearTimeout(server.neglect_timeout);
    server.neglect_timeout = setTimeout(neglected_timeout, TIMEOUT_NEGLECT);
  }

  // called when the neglect timeout expires
  neglected() {
    var server = this;

    // delay for 3 seconds to allow the bot to talk
    var neglectedrelease = function () {
      var timeout_neglectedrelease = function () {
        Common.out("neglected: in chan");
        server.release();
      };
      setTimeout(timeout_neglectedrelease, 3000);
    };

    if (server.inChannel()) {
      server.talk("talkbot inactivity timeout", null, neglectedrelease);
    } else {
      Common.out("neglected: server.release() not in chan");
      server.release();
    }
  }

  // run this to cleanup resources before shutting down
  shutdown() {
    Common.out("shutdown(): " + new Error().stack);
    var server = this;

    if (server.inChannel()) {
      server.talk("The server is shutting down", null, () => server.release());
    } else {
      server.release();
    }
  }

  // when the server is deleted or shutdown or disconnected run this to cleanup things
  dispose() {
    this.shutdown();
    clearTimeout(this.neglect_timeout);
  }

  // save the state file
  save(_filename) {
    var self = this;
    this.updated = new Date();
    function replacer(key, value) {
      if (key.endsWith("_timeout")) return undefined; // these keys are internal timers that we dont want to save
      if (key == "commandResponses") return undefined;
      if (key == "bound_to") return undefined;
      if (key == "world") return undefined;
      if (key == "guild") return undefined;
      if (key == "keepQueue") return undefined;
      if (key == "switchQueue") return undefined;
      if (key == "twitch") return undefined;
      else return value;
    }

    if (!_filename) _filename = paths.config + "/" + self.server_id + ".server";
    fs.writeFileSync(_filename, JSON.stringify(self, replacer), "utf-8");
  }

  // load the state file
  loadState() {
    var self = this;
    var _filename = paths.config + "/" + self.server_id + ".server";

    if (fs.existsSync(_filename)) {
      return JSON.parse(fs.readFileSync(_filename));
    }

    return null;
  }

  // speak a message in a voice channel - raw text
  talk(message, options, callback) {
    var server = this;
    if (!server.inChannel()) return;
    if (!options) options = {};
    if (!callback) callback = function () {};

    let settings = {};

    if (options.name != "default") settings.name = options.name;
    if (options.pitch != "default") settings.pitch = options.pitch;
    if (options.speed != "default") settings.speed = options.speed;
    if (options.voice_provider)
      settings.voice_provider = options.voice_provider;

    server.resetNeglectTimeout();

    let service =
      TextToSpeechService.getService(
        settings.voice_provider || server.defaultProvider
      ) || TextToSpeechService.defaultProvider;
    let request = service.buildRequest(message, settings, server);

    console.log(request);

    // Performs the Text-to-Speech request
    service.getAudioContent(request, (err, audio) => {
      if (err) {
        Common.error(err);
        return;
      }
      try {
        // might have to queue the content if its playing currently
        server.playAudioContent(audio, service.format, callback);
      } catch (e) {
        Common.error(e);
      }
    });
  }

  // stop currently playing audio and empty the audio queue (all=true)
  stop(reason, all) {
    if (all) {
      this.audioQueue = [];
    }
    if (this.guild.voice.connection && this.guild.voice.connection.dispatcher)
      this.guild.voice.connection.dispatcher.end(reason);
  }

  // internal function for playing audio content returned from the TTS API and queuing it
  playAudioContent(audioContent, format, callback) {
    var server = this;
    var readable = audioContent;

    if (!readable.pipe) {
      return Common.error(
        new Error(
          "playAudioContent: Received audioContent that was not a readable stream"
        )
      );
    }

    var endFunc = (reason) => {
      clearTimeout(server.voice_timeout);
      server.playing = false;
      if (server.guild.voice.connection.dispatcher)
        server.guild.voice.connection.dispatcher.setSpeaking(false);
      server.voice_timeout = null;
      try {
        callback();
      } catch (ex) {
        Common.error(ex);
      }
      if (!server.audioQueue) return;
      var nextAudio = server.audioQueue.shift();
      if (reason != "stream") {
        // if the stream hasn't ended normally
        server.audioQueue = [];
        Common.error("Cancelled queue: " + reason);
      } else if (nextAudio) nextAudio();
    };

    // queue it up if there's something playing
    // queueFunc is a call containing both the callback and the content
    if (server.playing) {
      if (!server.audioQueue) server.audioQueue = [];
      var queueFunc = () => server.playAudioContent(readable, format, callback);
      server.audioQueue.push(queueFunc);
      return;
    }

    if (server.leaving) return;
    if (!server.guild.voice.connection)
      return Common.error(
        "Tried to play audio content when there's no voice connection. " +
          new Error().stack
      );

    // play the content
    server.playing = true;
    clearTimeout(server.voice_timeout);
    server.voice_timeout = setTimeout(
      () =>
        server.guild.voice.connection.dispatcher
          ? server.guild.voice.connection.dispatcher.end("timeout")
          : null,
      60000
    );

    try {
      server.guild.voice.connection
        .play(readable, { type: "ogg/opus" })
        .on("end", endFunc)
        .on("error", Common.error);
    } catch (ex) {
      Common.error(ex);
    }
  }

  // call this if you want to check a msg content is valid and run it through translation
  speak(message) {
    var server = this;
    var settings = server.getMemberSettings(message.member);

    if (
      message.cleanContent.length < 1 ||
      Common.isMessageExcluded(message.cleanContent) ||
      !server.inChannel() ||
      !server.isPermitted(message.member) ||
      settings.muted
    )
      return;

    var accept = commands.notify("validate", {
      message: message,
      server: server,
    });

    if (accept === false) return; // nerf the message because it didnt validate

    var content = Common.cleanMessage(message.cleanContent);

    var ret = commands.notify("message", {
      message: message,
      content: content,
      server: server,
    });
    if (ret) content = ret;

    if (content.length < 1) return;

    ret = commands.notify("configureVoice", {
      message: message,
      original_settings: settings,
      server: server,
    });
    if (ret) settings = ret;

    function _speak(msg, settings) {
      server.talk(msg, settings, () =>
        commands.notify("messageDelivered", {
          message: message,
          content: message.message,
          server: server,
        })
      );
    }

    var tolang = server.getMemberSetting(message.member, "toLanguage");
    if (tolang && tolang != "default") {
      botStuff.translate_client
        .translate(content, tolang)
        .then((results) => {
          _speak(results[0], settings);
        })
        .catch(Common.error);
    } else {
      _speak(content, settings);
    }
  }
}

module.exports = Server;
