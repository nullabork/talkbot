/*jshint esversion: 9 */

const botStuff = require("@helpers/bot-stuff"),
  Server = require("@models/Server"),
  Common = require("@helpers/common"),
  auth = require("@auth"),
  bot = botStuff.bot;

class World {
  constructor() {
    this.servers = {};
    this.presence_timeout = null;
    this.default_title = auth.default_title || "master";
  }

  /* * *
   * startup()
   *
   * Actions that run when the world object is created
   * * */
  startup() {
    var world = this;
    bot.guilds.cache.forEach((guild) => world.addServer(guild));
    world.setPresence();
    world.startRebootTimer();
  }

  /* * *
   * addServer()
   *
   * Add a server to the world - pass Guild
   * * */
  addServer(guild) {
    this.servers[guild.id] = new Server(guild, this);
    this.setPresence();
    Common.out(guild.id + ": added to the world");
  }

  /* * *
   * removeServer()
   *
   * Remove a server from the world - pass Guild
   * * */
  removeServer(guild) {
    if (!this.servers[guild.id]) return;
    var server = this.servers[guild.id];
    delete this.servers[guild.id];
    this.setPresence();
    server.save();
    server.dispose();
    Common.out(guild.id + ": removed from the world");
  }

  /* * *
   * setPresence()
   *
   * Set the bot's presence
   * * */
  setPresence() {
    var w = this;
    var presence_timer = function () {
      w.presence_timeout = null;

      bot.user.setPresence({
        status: "online",
        game: {
          name: w.renderPresenceHelp(),
          type: 1,
          url: "https://github.com/nullabork/talkbot",
        },
      });
    };

    // this protects against spamming discord with presence updates
    // and getting banned
    if (this.presence_timeout) clearTimeout(this.presence_timeout);
    this.presence_timeout = setTimeout(presence_timer, 50);
  }

  /* * *
   * renderPresenceHelp()
   *
   * Create a presence string
   * * */
  renderPresenceHelp() {
    var cmds = require("@commands");
    var n = (this.getTotalCharacterCount() / 1000).toFixed(1);
    return cmds.command_char + `help, ${Number.isNaN(n) ? 0 : n}k chars`;
  }

  /* * *
   * getTotalCharacterCount()
   *
   * Gets the total char count of servers
   * * */
  getTotalCharacterCount() {
    var c = 0;
    for (var server in this.servers)
      if (
        this.servers[server].stats &&
        !isNaN(this.servers[server].stats.characterCount) &&
        typeof this.servers[server].stats.characterCount == "number"
      )
        c += this.servers[server].stats.characterCount;
    return c;
  }

  /* * *
   * saveAll()
   *
   * Save the state of every server in the world
   * * */
  saveAll() {
    for (var server_id in this.servers) {
      this.servers[server_id].save();
    }
  }

  /* * *
   * releaseAll()
   *
   * Call release() on each server
   * * */
  releaseAll() {
    for (var server_id in this.servers) {
      this.servers[server_id].release();
    }
  }

  /* * *
   * kill()
   *
   * Attempts to shutdown gracefully - pass a reason
   * * */
  kill(reason) {
    if (reason) Common.out("kill(): " + reason);
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
  }

  /* * *
   * startRebootTimer()
   *
   * When called sets the bot to automatically reboot when no one is using it
   * Its a hack to work around network bugs and so forth
   * * */
  startRebootTimer() {
    var world = this;

    var reboot_timer = function () {
      if (world.getActiveServersCount() == 0) {
        world.kill("Inactivity reboot");
        return;
      }

      // if someone is using it it'll get here and we'll
      // check again in an hour to see if we can reboot it
      setTimeout(reboot_timer, 60 * 60 * 1000);
    };

    // kick off in 12 hours
    setTimeout(reboot_timer, 12 * 60 * 60 * 1000);
  }

  /* * *
   * dispose()
   *
   * Safely clean up any resources for this class
   * * */
  dispose() {
    for (var s in this.servers) {
      this.servers[s].dispose();
    }
  }
}

module.exports = new World();
