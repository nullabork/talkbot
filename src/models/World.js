
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
    this.presence_renderers = [this.renderPresenceHelp]; // , this.renderPresenceCounts, this.renderPresenceFollow];
    this.presence_renderers_index = 0;
    this.presence_rotation_timeout = null;
    this.presence_timeout = null;
    this.default_title = 'master';    
  }

  startup() {
    var world = this;
    world.setPresence();
    world.startRebootTimer();
    bot.guilds.tap(guild => world.addServer(new Server(guild, world)));
  };  
    
  addServer(server) {
    this.servers[server.server_id] = server;
  }

  removeServer(server) {
    if ( !this.servers[server.server_id] ) return;
    delete this.servers[server.server_id];
    server.save();
    server.dispose();
  }

  setPresence() {

    var w = this;
    var presence_timer = function() {
      w.presence_timeout = null;

      bot.user.setPresence({
        status: 'online',
        game: {
          name: w.renderPresenceHelp(),
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
  
  renderPresenceHelp() {
    var cmds = require("@commands");
    return bot.guilds.size + " servers, " + cmds.command_char + "help";
  };
  
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
  
/* * *
 * kill()
 *
 * Attempts to shutdown gracefully - pass a reason 
 * * */
  kill(reason) {
    if (reason) Common.out('kill(): ' + reason);
    this.releaseAll();
    this.saveAll();
    bot.destroy();
    process.exit();
  }
  
/* * *
 * getActiveServersCount()
 *
 * Gets the number of servers where someone is !following 
 * * */
  getActiveServersCount() {
    var w = this;
    var c = 0;
    for (var s in w.servers) {
      if (w.servers[s].isBound()) c++;
    }
    return c;
  };
    
/* * *
 * startRebootTimer()
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
  
  dispose() {
    for ( var s in this.servers ) {
      this.servers[s].dispose();
    }
  };
  
}

module.exports = new World();
