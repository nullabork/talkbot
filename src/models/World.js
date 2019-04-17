
var fs = require('fs'),
  paths = require('@paths'),
  botStuff = require("@helpers/bot-stuff"),
  Server = require("@models/Server"),
  auth = require("@auth"),
  Common = require("@helpers/common"),
  bot = botStuff.bot;

class World {

  constructor() {
    this.servers = {};
    this.broadcastTimout = null;
    this.broadcastID = null;
    this.broadcastMessage = null;
    this.broadcaster = null;
    this.presence_renderers = [this.renderPresenceHelp]; // , this.renderPresenceCounts, this.renderPresenceFollow];
    this.presence_renderers_index = 0;
    this.presence_rotation_timeout = null;
    this.presence_timeout = null;
    this.default_title = 'master';    
  }

  startup() {
    var world = this;
    world.setPresence();
    world.startPresenceRotation();
    world.startRebootTimer();
  };  
  
  addServer(server) {
    if (!server.server_id) return;
    this.servers[server.server_id] = server;
  }

  removeServer(server) {
    if ( !this.servers[server.server_id] ) return;
    delete this.servers[server.server_id];
    server.save();
    server.dispose();
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
      
      for (var server_id in world.servers) {
        var s = world.servers[server_id];
        if (s.bound_to == user_id) {
          if (chan_id != s.current_voice_channel_id) {
            leave_servers.push(s);
          }
        }
      }
      
      for ( var i=0;i<leave_servers.length;i++) {     
        var s = leave_servers[i];
        s.talk('My master left, bye everyone', null, function() { s.release(); });
      }      
    };

    setTimeout(delayed_execution, 1000);
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
  
  // save all the states
  saveAll() {
    for (var server_id in this.servers) {
      this.servers[server_id].save();
    }
  };
  
  // release all servers from their masters
  releaseAll() {
    for (var server_id in this.servers) {
      this.servers[server_id].release();
    }
  };
  
  // shutdown the process
  kill(reason) {
    if (reason) Common.out('kill(): ' + reason);
    this.releaseAll();
    this.saveAll();
    bot.disconnect();
    process.exit();
  }
  
  getActiveServersCount() {
    var w = this;
    var c = 0;
    for (var s in w.servers) {
      if (w.servers[s].isBound()) c++;
    }
    return c;
  };
  
  startPresenceRotation() {
    var world = this;
    var rotatePresenceBanner = function() {
      var w = world;
      w.nextPresenceRenderer();
      w.setPresence();
      //if ( w.presence_rotation_timeout )
      //  clearTimeout(w.presence_rotation_timeout);
      //w.presence_rotation_timeout = setTimeout(rotatePresenceBanner, 120000);
    };
    
    rotatePresenceBanner();
  };
  
/* * *
 * startRebootTimer
 *
 * When called sets the bot to automatically reboot when no one is using it
 * Its a hack to work around network bugs and so forth 
 * * */
  startRebootTimer() {
    var world = this;
    
    var reboot_timer = function() {
      
      if ( world.getActiveServersCount() == 0 )
      {
        world.kill('Inactivity reboot');
      }
      
      setTimeout(reboot_timer, 60 * 60 * 1000); // every hour check if no one is using
    };
    
    setTimeout(reboot_timer, 12 * 60 * 60 * 1000); // kick off in 12 hours
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
    var s = Object.keys(bot.servers).length + " servers, " + w.getActiveServersCount() + " active";
    return s;
  };
  
  dispose() {
    for ( var s in this.servers ) {
      this.servers[s].dispose();
    }
    
    clearTimeout(this.presence_timeout);
    clearTimeout(this.presence_rotation_timeout);
  };
  
}

module.exports = new World();
