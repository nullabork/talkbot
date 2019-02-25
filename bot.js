

//npm imports
require('module-alias/register');
var path = require('path'),
  paths = require('@paths');
//helpers
var commands = require('@commands'),
  botStuff = require('@helpers/bot-stuff');
  Common = require('@helpers/common'),
  testing = require('@helpers/runtime-testing');

//models
var world = require('@models/World'),
  Server = require('@models/Server'),
  MessageSSML = require('@models/MessageSSML'),
  MessageDetails = require('@models/MessageDetails');

// runtime testing
testing.TestIfChildProcessIsWorkingHowDiscordIONeedsItTo();
testing.TestIfGoogleEnvironmentVarIsSet();

// Creates a client
var bot = botStuff.bot;

// when the server is ready to go
bot.on('ready', function (evt) {
  Common.out('Logged in as: ' + bot.username + ' - (' + bot.id + ')');
  world.startDailyResetTimer();
  world.setPresence();
});

// if we get disconnected???
bot.on('disconnect', function (evt) {
  Common.out('Disconnected, reconnecting');
  Common.out(evt);
  bot.connect();
});

// handle voice state updates
bot.on('any', function (evt) {
  var user_id = null;
  var server_id = null;
  var channel_id = null;

  if (evt.t == 'VOICE_STATE_UPDATE') {

    // if my master's voice status changes
    if (evt.d) {
      channel_id = evt.d.channel_id;
      server_id = evt.d.guild_id;
      user_id = evt.d.user_id;
    }

    var server = world.servers[server_id];
    if (server == null) {
      Common.out("What server?: " + channel_id);
      if ( user_id ) world.checkMastersVoiceChannels(user_id);
      return null;
    }

    //was this eventer the current
    if (server.isMaster(user_id)) {
      if (!channel_id) {
        if (server.inChannel()) {
          server.leaveVoiceChannel();
        }
      } else {
        server.joinVoiceChannel(channel_id);
      }
    }
  }
});

// new servers arrive
bot.on('guildCreate', function(server) {
  var server_id = server.id;
  world.addServer(new Server(server_id));
  Common.out("Server " + bot.servers[server_id].name + " started");
});

// new servers get deleted
bot.on('guildDelete', function(server) {
  if (!server) return; // why would we lose a server?
  var world_server = world.servers[server.id];
  var name = world_server.server_name;
  world.removeServer(world_server);
  Common.out("Server " + name + " removed");
});

bot.on('message', function (username, user_id, channel_id, message, evt) {

  if (!evt.d) return null;

  var server_id = evt.d.guild_id;
  var server = world.servers[server_id];

  if (server == null) {
    Common.error("Can't find server for " + channel_id);
    return null;
  }

  // is the message a command?
  if (message.substring(0, commands.command_char.length) == commands.command_char) {

    server.resetNeglectTimeout();

    var parts = message.match(
      new RegExp("(" + Common.escapeRegExp(commands.command_char) + ")([^ ]+)(.*)", "i")
    );

    if (!parts || parts.length < 2) {
      return;
    }

    var cmdChar = parts[1];
    var cmdVerb = parts[2] || null;
    var cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
    var cmdMessage = (parts[3] || "").trim()

    if (!cmdVerb || !cmdChar) {
      return;
    }

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

    commands.run(msgDets.cmd, [msgDets, server, world]);

  } else {

    if (
      message.length < 1 ||
      Common.isMessageExcluded(message) ||
      !server.inChannel() ||
      !server.isPermitted(user_id)
    ) return;

    var ret = commands.notify('message', [message, user_id, server, world]);
    if (ret) message = ret;

    message = botStuff.resolveMessageSnowFlakes(channel_id, message);
    message = Common.cleanMessage(message);

    function speak(msg) {
      var message = new MessageSSML(msg, { server: server }).build();
      var settings = server.getUserSettings(user_id);
      server.talk(message, settings);
    }

    var tolang = server.getUserSetting(user_id, 'toLanguage');
    if (tolang && !tolang == "default") {

      botStuff.translate_client
        .translate(message, tolang)
        .then( results => {
          speak(results[0]);
        })
        .catch(err => {
          Common.error( err );
        });
    } else {
      speak(message);
    }
  }
});

process.on('SIGINT', function () {
  Common.out('SIGINT');
  world.saveAll();
  bot.disconnect();
  process.exit();
});

process.on('uncaughtException', function (err) {
  Common.out('uncaughtException');
  world.saveAll();
  Common.error(err);
  bot.disconnect();
  process.exit();
});
