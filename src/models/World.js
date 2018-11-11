
var paths = require('../../config/urls'),
  fs = require('fs'),
  botStuff = require('../helpers/bot-stuff'),
  Server = require(paths.join(paths.models, 'Server')),
  bot = botStuff.bot;

class World {
  static get NEGLECT_TIMEOUT_IN_MS() {
    return 30 * 60 * 1000;
  }

  constructor(server_id, server_data) {
    this.servers = {};
  }

  addServer(server) {
    if (!server.server_id) {
      return;
    }
    this.servers[server.server_id] = server;
    this.save();
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

  broadcast(message) {
    for (var server in this.servers) {
      server.sendMessageToOwner(message);
    }
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
    if (!user_id) return;
    var voiceChan = botStuff.getUserVoiceChannel(user_id);
    for (var server in this.servers) {
      var s = this.servers[server];
      if (s.bound_to == user_id) {
        if (voiceChan != s.current_voice_channel_id)
          s.leaveVoiceChannel();
      }
    }
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


  save(_filename) {
    function replacer(key, value) {
      if (key == "neglect_timeout") return undefined; // this key is an internal that we dont want to save
      else return value;
    };

    if (!_filename) _filename = paths.state;
    fs.writeFileSync(_filename, JSON.stringify(this.servers, replacer), 'utf-8');
  }

  load() {
    try {
      var file = require(paths.state);
      for (var server_id in file) {
        var server = new Server(file[server_id], server_id);
        this.servers[server_id] = server;
        server.init();
      }
    } catch (ex) {
      console.error(ex);
      this.save();
    }
  }
}

module.exports = new World();
