
var fs = require('fs'),
  paths = require('@paths'),
  botStuff = require("@helpers/bot-stuff"),
  Server = require("@models/Server"),
  auth = require("@auth"),
  bot = botStuff.bot;

class World {
  static get NEGLECT_TIMEOUT_IN_MS() {
    return 30 * 60 * 1000;
  }


  constructor(server_id, server_data) {
    this.servers = {};
    this.broadcastTimout = null;
    this.broadcastID = null;
    this.broadcastMessage = null;
    this.broadcaster = null;
  }

  addServer(server) {
    if (!server.server_id) {
      return;
    }
    this.servers[server.server_id] = server;
    this.save();
    this.setPresence();
  }

  removeServer(server) {
    this.servers[server.server_id] = null;
  }

  resetNeglectTimeouts() {
    for (var server in this.servers) {
      server.resetNeglectTimeout();
    }
  }

  permitAllMasters() {
    for (var server in this.servers) {
      if (server.isBound()) {
        server.setMaster(server.bound_to, server.bound_to_username);
      }
    }
  }

  broadcast(message, user_id) {
    var self = this;
    if (!(auth.dev_ids.indexOf(user_id) >= 0)) {
      return;
    }

    if (this.broadcastID == null) {


      this.broadcastID = (Math.floor(Math.random() * 90000) + 10000) + "";
      this.broadcastMessage = message;
      this.broadcaster = user_id;

      setTimeout(function () {
        self.broadcastID = null;
        self.broadcastMessage = null;
        self.broadcaster = null;
      }, 20000);

      return this.broadcastID;

    } else if (this.broadcaster != user_id) {
      for (var key in bot.servers) {
        var server = bot.servers[key];
        bot.sendMessage({
          to: server.owner_id,
          message: self.broadcastMessage
        });
      }

      self.broadcastID = null;
      self.broadcastMessage = null;
      self.broadcaster = null;
    }

    return null;
  }

  unpermitAll() {
    for (var server in this.servers) {
      server.release();
    }
  }

  getServerFromChannel(channel_id) {
    var chan = bot.channels[channel_id];
    if (chan) {
      var server = this.servers[bot.channels[channel_id].guild_id];
      return server;
    }
    return null;
  }

  checkMastersVoiceChannels(user_id) {
    
    var world = this;
    if (!user_id) return;
    
    // calling getUserVoiceChannel() during the VOICE_STATUS_UPDATE event 
    // means that bot.servers[...] etc. arrays are not yet up to date. 
    // The underlying framework is providing the events to us before processing
    // itself.
    // run delayed execution of the code to get the real answers
    var delayed_execution = function() {
      var voiceChan = botStuff.getUserVoiceChannel(user_id);
      var leave_servers = [];
      var delayed_leave = function() {
        for ( var i=0;i<leave_servers.length;i++) {
          leave_servers[i].leaveVoiceChannel();
          leave_servers[i].startUnfollowTimer();
        }
      };
      
      for (var server in world.servers) {
        var s = world.servers[server];
        if (s.bound_to == user_id) {
          if (voiceChan != s.current_voice_channel_id) {
            leave_servers.push(s);
            s.talk("Oh no my master left me!", null, delayed_leave);
          }
        }
      }
    };
    
    setTimeout(delayed_execution, 100);
  }

  initServers() {
    for (var server in bot.servers) {
      if (!this.servers[server]) {
        this.addServer(
          new Server(bot.servers[server])
        );
      }
    }
  }

  setPresence() {

    var c = 0;
    for (var s in this.servers) {
      if (this.servers[s].isBound()) c++;
    }

    bot.setPresence({
      status: 'online',
      game: {
        name: Object.keys(bot.servers).length + " servers, " + c + " active",
        type: 1,
        url: 'https://github.com/wootosmash/talkbot'
      }
    });
  }

  save(_filename) {
    var self  = this;
    setTimeout(function(){
      function replacer(key, value) {
        if (key.endsWith("_timeout")) return undefined; // these keys are internal timers that we dont want to save
        if (key == "commandResponses") return undefined;
        else return value;
      };

      if (!_filename) _filename = paths.state;
      fs.writeFileSync(_filename, JSON.stringify(self.servers, replacer), 'utf-8');
    },10);
  }

  load() {
    try {
      var file = require(paths.state);
      for (var server_id in file) {
        var server = new Server(file[server_id], server_id);
        this.servers[server_id] = server;
        server.init();
      }
      this.setPresence();
    } catch (ex) {
      Common.error(ex);
      this.save();
    }
  }
}

module.exports = new World();
