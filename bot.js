var _config = './config',
  //commands_path = './commands',
  state_path = _config + '/state.json',
  auth_path = _config + '/auth.json',
  lang_path = _config + '/lang.json';

//npm imports
var fs = require('fs'),
  request = require('request'),
  Discord = require('discord.io'),
  textToSpeech = require('@google-cloud/text-to-speech'),
  Lang = require("lang.js");

//local imports

var SSML = require('./modules/discord-to-ssml').default,
  hacks = require('./modules/awesome-hacks.js'),
  commands = require('./modules/commands/index').default,
  botStuff = require('./modules/bot-stuff'),
  common = require('./modules/common');

var auth = require(auth_path),
  messages = require(lang_path),
  state = require(state_path);
//commands = require(commands_path);


// Creates a client
var tts_client = new textToSpeech.TextToSpeechClient();

var bot = botStuff.bot;

var ssml = new SSML({});

var lang = new Lang({
  messages: messages,
  locale: 'en',
  fallback: 'en'
});

var world = {
  NEGLECT_TIMEOUT_IN_MS: 30 * 60 * 1000, // 30 mins

  servers: {},

  addServer: function (serverObj) {
    this.servers[serverObj.id] = new Server(serverObj, serverObj.id);

    this.save();
  },

  removeServer: function (server_id) {
    this.servers[server_id] = null;
  },

  resetNeglectTimeouts: function () {
    for (var server in this.servers) {
      server.resetNeglectTimeout();
    }
  },

  permitAllMasters: function () {
    for (var server in this.servers) {
      if (server.isBound())
        server.setMaster(server.bound_to, server.bound_to_username);
    }
  },

  unpermitAll: function () {
    for (var server in this.servers) {
      server.release();
    }
  },

  getServerFromChannel: function (channel_id) {
    var chan = bot.channels[channel_id];
    if (chan) {
      var server = this.servers[bot.channels[channel_id].guild_id];
      return server;
    }
    else
      return null;
  },

  checkMastersVoiceChannels: function (user_id) {
    if (!user_id) return;
    var voiceChan = botStuff.getUserVoiceChannel(user_id);
    for (var server in this.servers) {
      var s = this.servers[server];
      if (s.bound_to == user_id) {
        if (voiceChan != s.current_voice_channel_id)
          s.leaveVoiceChannel();
      }
    }
  },

  initServers: function () {
    for (var server in bot.servers) {
      if (!this.servers[server])
        this.addServer(bot.servers[server]);
    }
  },

  _save: function (_filename) {
    var replacer = function (key, value) {
      if (key == "neglect_timeout") return undefined; // this key is an internal that we dont want to save
      else return value;
    };

    if (!_filename) _filename = state_path;
    fs.writeFileSync(_filename, JSON.stringify(this.servers, replacer), 'utf-8');
  },

  save: function (_filename) {
    this._save(_filename);
  },

  load: function () {
    try {
      var file = require(state_path);
      for (var server_id in file) {
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

function MessageDetails(client_data) {

  if (!this instanceof MessageDetails) {
    return new MessageDetails(client_data);
  }

  this.channel_id = null;
  this.user_id = null;
  this.bot = null;
  this.world = null;
  this.server = null;
  this.username = null;
  this.args = null;
  this.message = '';
  var self = this;

  if (client_data) {
    Object.assign(this, client_data);
  }

  this.sendMessage = this.response = function (message) {
    self.bot.simulateTyping(self.channel_id, function () {
      self.bot.sendMessage({
        to: self.channel_id,
        message: message
      });
    });
  }

  this.getNick = function (user_id) {
    return botStuff.findThingsName(this.channel_id, user_id);
  };

  this.ownerIsMaster = function () {
    return this.server.isMaster(this.user_id);
  }

  this.ownerIsDev = function () {
    if (!auth.dev_ids || !auth.dev_ids.length) {
      return false;
    }
    return auth.dev_ids.indexOf(this.user_id) >= 0;
  }

  this.ownerIsPermitted = function () {
    return this.server.permitted[this.user_id] != null;
  };

  this.messageNick = function () {
    return this.getNick(this.user_id);
  }

  this.getMessage = function () {
    return this.message;
  }

  this.boundNick = function () {
    return botStuff.findThingsName(this.channel_id, this.server.bound_to);
  }

  this.getOwnersVoiceChannel = function () {
    return botStuff.getUserVoiceChannel(this.user_id);
  };

  this.getUserIds = function () {
    return common.messageIDs(this.message);
  };
}

function Server(server_data, server_id) {

  var bot = botStuff.bot;

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
  this.messages = server_data.messages || {};

  this.sfx = {
    airhorn: 'sfx/airhorn.mp3',
  };

  this.init = function () {
    if (this.isBound()) {
      this._setMaster(this.bound_to, this.bound_to_username);
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
  };

  this.lang = function (key) {
    if (this.messages && this.messages[key]) {
      return this.messages[key];
    }
    return lang.get.apply(lang, Array.from(arguments));
  }

  this._setMaster = function (user_id, username) {
    this.bound_to = user_id;
    this.bound_to_username = username;
    this.permit(user_id);
    this.resetNeglectTimeout();
  };

  this.setMaster = function (user_id, username) {
    this._setMaster(user_id, username);
    world.save();
  };

  this.isServerChannel = function (channel_id) {
    return bot.channels[channel_id].guild_id == this.server_id;
  };

  this.getOwnersVoiceChannel = function (user_id) {
    return botStuff.getUserVoiceChannel(user_id);
  };

  this._release = function () {
    this.bound_to = null;
    this.bound_to_username = null;
    this.permitted = {};
    clearTimeout(this.neglect_timeout);
    this.neglect_timeout = null;
    if (this.inChannel())
      this.leaveVoiceChannel();

    world.save();
  };

  this.getChannelMembers = function (channel_id) {
    if (!bot.channels[channel_id]
      && !bot.servers[bot.channels[channel_id].guild_id]
      && bot.servers[bot.channels[channel_id].guild_id].members) {
      return bot.servers[bot.channels[channel_id].guild_id].members;
    }
    return null;
  };

  this.kill = function () {
    world.save();
    bot.disconnect();
    process.exit();
    console.log("asd");
  }


  this.release = function () {
    console.log('release');
    this._release();
    world.save();
  };

  this.isMaster = function (user_id) {
    if (!user_id) return false;
    return this.bound_to == user_id;
  };

  this.isBound = function () {
    return this.bound_to != null;
  };

  this.getBoundToNick = function () {
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

  this.inChannel = function () {
    return this.current_voice_channel_id != null;
  };

  this.isPermitted = function (user_id) {
    if (!user_id) return false;
    return this.permitted[user_id] != null;
  };

  this.joinVoiceChannel = function (channel_id, callback) {
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

  this.leaveVoiceChannel = function (callback) {
    if (!callback) callback = function () { };

    // HACK: delay the timeout as the callback sometimes runs before the state = left
    var callback_timeout = function () {
      setTimeout(callback, 2000);
    };

    if (this.current_voice_channel_id != null)
      bot.leaveVoiceChannel(this.current_voice_channel_id, callback_timeout);
    this.current_voice_channel_id = null;

    world.save();
  };

  this.permit = function (user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = {};
    world.save();
  };

  this.unpermit = function (user_id) {
    this.resetNeglectTimeout();
    this.permitted[user_id] = null;
    world.save();
  };

  this.resetNeglectTimeout = function () {
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

  this.talk = function (message, options) {
    this.resetNeglectTimeout();
    this._talk(message, options);
  };

  this._talk = function (message, options, callback) {
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

  };

  this.neglected = function () {
    var server = this;

    if (server.neglect_neglect) return;
    // delay for 3 seconds to allow the bot to talk
    var neglected_release = function () {
      var timeout_neglected_release = function () { server.release(); };
      setTimeout(timeout_neglected_release, 3000);
    };

    if (server.inChannel())
      server._talk("I feel neglected, I'm leaving", server, neglected_release);
    else
      server.release();
  };

  this.toggleNeglect = function() {
    this.neglect_neglect = !this.neglect_neglect;
    return this.neglect_neglect;
  }

  this.setNicks = function (channel_id, tokens) {

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

  this.playAudioFile = function (filename, callback) {
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

};

// var bot = new Discord.Client({
//   token: auth.token,
//   autorun: true
// });

bot.on('ready', function (evt) {
  console.log('Logged in as: ' + bot.username + ' - (' + bot.id + ')');

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

bot.on('disconnect', function (evt) {
  console.log('Disconnected');
  bot.connect();
});

bot.on('any', function (evt) {
  console.log(evt.t);

  if (evt.t == 'GUILD_CREATE') {

    // when added to a server do this - need to wait a bit for the library to init
    var add_server = function () { world.addServer(bot.servers[evt.d.id]); };

    setTimeout(add_server, 10000);
  }
  else if (evt.t == 'VOICE_STATE_UPDATE') {
    // if my master's voice status changes
    var channel_id = null;
    if (evt.d)
      var channel_id = evt.d.channel_id;
    var server = world.getServerFromChannel(channel_id);
    if (server == null) {
      console.log("What server?: " + channel_id);
      world.checkMastersVoiceChannels(evt.d.user_id);
      return null;
    }


    if (evt.d && server.isMaster(evt.d.user_id)) {

      if (!channel_id) {
        if (server.inChannel())
          server.leaveVoiceChannel();
      }
      else if (!botStuff.isVoiceChannel(channel_id))
        console.log('Not a voice channel');
      else {
        server.joinVoiceChannel(channel_id);
      }
    }
  }
});

bot.on('message', function (username, user_id, channel_id, message, evt) {

  var command_char = auth.command_char || '!';

  if (common.isMessageExcluded(message)) return null;

  var server = world.getServerFromChannel(channel_id);

  if (server == null) {
    console.error("Can't find server for " + channel_id);
    return null;
  }

  // is the message a command?
  if (message.substring(0, command_char.length) == command_char) {

    server.resetNeglectTimeout();
    //var args = message.substring(command_char.length).split(' ');
    var parts = message.match(
      new RegExp("(" + common.escapeRegExp(command_char) + ")([^ ]+)(.*)", "i")
    );

    var cmdChar = parts[1];
    var cmdVerb = parts[2] || null;
    var cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
    var cmdMessage = parts[3].trim() || null;
    // var cmd = args[0];

    //args = args.splice(1);

    var msgDets = new MessageDetails({
      channel_id: channel_id,
      user_id: user_id,
      bot: botStuff.bot,
      world: world,
      server: server,
      username: username,
      cmdChar: cmdChar,
      cmd: cmdVerb,
      args: cmdArgs,
      message: cmdMessage,
    });

    //console.log(commands, "<----");
    var command = commands.get(msgDets.cmd);

    console.log(msgDets.cmd, command(msgDets, server));

    //console.log(msgDets);

  } else {
    if (message == null) return;

    // tts bit
    message = common.resolveDiscordSnowflakes(channel_id, message);
    if (!server.permitted[user_id] || !server.permitted[user_id].use_ssml)
      message = hacks.parse(channel_id, message);
    message = ssml.build(message);

    if (message.length < 1) return;

    if (server.inChannel()) {
      if (server.isPermitted(user_id)) {
        server.talk(message, server.permitted[user_id]);
      }
    }
  }
});


process.on('SIGINT', function () {
  world.save();
  bot.disconnect();
  process.exit();
});
