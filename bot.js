/*
 *  _____     _ _    ____        _
 * |_   _|_ _| | | _| __ )  ___ | |_
 *   | |/ _` | | |/ /  _ \ / _ \| __|
 *   | | (_| | |   <| |_) | (_) | |_
 *   |_|\__,_|_|_|\_\____/ \___/ \__|
 *
 * http://github.com/nullabork/talkbot
 */

//npm imports
require('module-alias/register');
var figlet = require('figlet');

var path = require('path'),
  paths = require('@paths');

//helpers
var commands = require('@commands'),
  botStuff = require('@helpers/bot-stuff'),
  MessageDetails = require('@models/MessageDetails'),
  Common = require('@helpers/common'),
  testing = require('@helpers/runtime-testing');

//models
var world = require('@models/World'),
  Server = require('@models/Server'),
  Command = require('@models/Command');

// runtime testing
testing.TestIfChildProcessIsWorkingHowDiscordIONeedsItTo();
testing.TestIfGoogleEnvironmentVarIsSet();

// Creates a client
var bot = botStuff.bot;

// FANCY SPLASH SCREEN
figlet('TalkBot', function(err, data) {
  console.log(data);
});

// when the server is ready to go
bot.on('ready', function (evt) {
  Common.out('Logged in as: ' + bot.username + ' - (' + bot.id + ')');
  world.startup();
});

// if we get disconnected???
bot.on('disconnect', function (evt) {
  world.saveAll();
  world.dispose();
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
    if (server == null || server.isMaster(user_id)) {
      if ( user_id ) world.checkMastersVoiceChannels(user_id);
      return null;
    }
  }
});

// new servers arrive
bot.on('guildCreate', function(server) {
  var server_id = server.id;

  //create server instance
  let s = new Server(server_id,world);
  //add the relationships
  world.addServer(s);

});

// servers get deleted
bot.on('guildDelete', function(server) {
  if (!server) return; // why would we lose a server?
                       // because the world isn't a marshmallow
  var world_server = world.servers[server.id];
  var name = world_server.server_name;
  world.removeServer(world_server);
  Common.out("Server " + name + " removed");
});

// when messages come in
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
    var cmdMessage = (parts[3] || "").trim();

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

    var command = commands.get(msgDets.cmd);
    if(!command) return;

    //this is for the new way... v3 of writing commands, so we can use argument destructoring
    if (command instanceof Command) {
      command.execute({details : msgDets, input : msgDets, server, world});
    } else {
      command.execute.apply(this, [msgDets, server, world]);
    }

  } else {
    // if its not a command speak it
    var settings = server.getUserSettings(user_id);
    if ( !settings.muted ) server.speak(message, channel_id, user_id, world);
  }
});

// ctrl-c
process.on('SIGINT', function () {
  Common.out('SIGINT');
  world.saveAll();
  bot.disconnect();
  process.exit();
});

// something goes wrong we didnt think of or having got around to putting a band-aid fix on
process.on('uncaughtException', function (err) {
  Common.out('uncaughtException');
  world.saveAll();
  Common.error(err);
  bot.disconnect();
  process.exit();
});
