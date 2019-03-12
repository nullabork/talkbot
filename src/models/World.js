
var fs = require('fs'),
  paths = require('@paths'),
  botStuff = require("@helpers/bot-stuff"),
  Server = require("@models/Server"),
  auth = require("@auth"),
  bot = botStuff.bot;

class World {
  static get NEGLECT_TIMEOUT_IN_MS() {
    return 120 * 60 * 1000;
  }


  constructor() {
    this.servers = {};
    this.broadcastTimout = null;
    this.broadcastID = null;
    this.broadcastMessage = null;
    this.broadcaster = null;
    this.presence_timeout = null;
    this.presence_renderers = [this.renderPresenceCounts, this.renderPresenceHelp, this.renderPresenceFollow];
    this.presence_renderers_index = 0;
    this.presence_rotation_timeout = null;
    
    this.resetDailyStats();
  }

  
  addServer(server) {
    if (!server.server_id) return;
    this.servers[server.server_id] = server;
    server.rejoinVoiceChannel();
  }

  removeServer(server) {
    if ( !this.servers[server.server_id] ) return;
    this.servers[server.server_id].save();
    delete this.servers[server.server_id];
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
      var chan_id = botStuff.getUserVoiceChannel(user_id);
      
      var leave_servers = [];
      var delayed_leave = function() {
        for ( var i=0;i<leave_servers.length;i++) {
          leave_servers[i].leaveVoiceChannel(function() {
            if ( chan_id) leave_servers[i].joinVoiceChannel(chan_id);
            else leave_servers[i].startUnfollowTimer();
          });
        }
      };
      
      for (var server_id in world.servers) {
        var s = world.servers[server_id];
        if (s.bound_to == user_id) {
          if (chan_id != s.current_voice_channel_id) {
            leave_servers.push(s);
            s.talk("Oh no my master left me!", null, delayed_leave);
          }
        }
      }
    };

    setTimeout(delayed_execution, 100);
  }

  setPresence() {

    var w = this;
    var presence_timer = function() {
      w.presence_timeout = null;

      bot.setPresence({
        status: 'online',
        game: {
          name: w.renderPresence(),
          type: 1,
          url: 'https://github.com/nullabork/talkbot'
        }
      });
    };
    
    // this protects against spamming discord with presence updates
    // and getting banned
    if ( this.presence_timeout )
      clearTimeout(this.presence_timeout);
    this.presence_timeout = setTimeout(presence_timer, 50);
  }
  
  saveAll() {
    for (var server_id in this.servers) {
      this.servers[server_id].save();
    }
  };
  
  kill() {
    this.saveAll();
    bot.disconnect();
    process.exit();
  }
  
  incrementStatDailyActiveServers(server_id) {
    this._dailyStats.activeServers[server_id] = 1;
  };
  
  startDailyResetTimer() {
    var world = this;
    var daily_reset = function() {
      world.resetDailyStats();
    };
    
    setTimeout(daily_reset, 24 * 60 * 60 * 1000);
  };
  
  resetDailyStats() {
    this.dailyStats = this._dailyStats;
    this._dailyStats = {};
    this._dailyStats.activeServers = {};
  };
  
  startPresenceRotation() {
    var world = this;
    var rotatePresenceBanner = function() {
      var w = world;
      w.nextPresenceRenderer();
      w.setPresence();
      if ( w.presence_rotation_timeout )
        clearTimeout(w.presence_rotation_timeout);
      w.presence_rotation_timeout = setTimeout(rotatePresenceBanner, 15000);
    };
    
    rotatePresenceBanner();
  };
  
  nextPresenceRenderer() {
    this.presence_renderers_index++;
  };
  
  renderPresence() {
    var renderer = this.presence_renderers[this.presence_renderers_index % this.presence_renderers.length];
    return renderer.call(this); //HACKSSSS
  };
  
  renderPresenceFollow() {
    var cmds = require("@commands");
    return Object.keys(bot.servers).length + " servers, " + cmds.command_char + "follow";
  };
  
  renderPresenceHelp() {
    var cmds = require("@commands");
    return Object.keys(bot.servers).length + " servers, " + cmds.command_char + "help";
  };
  
  renderPresenceCounts() {
    var w = this;
        
    var c = 0;
    for (var s in w.servers) {
      if (w.servers[s].isBound()) c++;
    }
    
    var s = Object.keys(bot.servers).length + " servers, " + c + " active";
    
    return s;
  };
  
}

module.exports = new World();
