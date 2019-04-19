'use strict'
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
testing.TestIfChildProcessIsWorkingHowDiscordJSNeedsItTo();
testing.TestIfGoogleEnvironmentVarIsSet();
testing.TestIfNodeOpusIsInstalled();
// TODO: Test node-opus is installed

// Creates a client
var bot = botStuff.bot;

// FANCY SPLASH SCREEN
figlet('TalkBot', (err, data) => console.log(data));

// when the server is ready to go
bot.on('ready', () => {
  Common.out('Logged in as: ' + bot.user.username + ' - (' + bot.user.id + ')');
  world.startup();
});

// if we get disconnected???
bot.on('disconnect', evt => {
  try {
    world.saveAll();
    world.dispose();
    Common.out('Disconnected, reconnecting');
    Common.out(evt);
    botStuff.connect();
  }
  catch(ex) { Common.error(ex); }
});

// when the bot is added to new servers
bot.on('guildCreate', guild => {
  try {
    //add the relationships
    world.addServer(new Server(guild, world));
  }
  catch(ex) { Common.error(ex); }
});

// when the bot is removed from servers
bot.on('guildDelete', guild => {
  try {
    var world_server = world.servers[guild.id];
    world.removeServer(world_server);
    Common.out("Server " + guild.name + " removed");
  }
  catch(ex) { Common.error(ex); }
});

// handle voice state updates
bot.on('voiceStateUpdate', (oldMember, newMember) => {
  try {
    var server = world.servers[oldMember.guild.id];
    if (!server.isMaster(oldMember.id))
      return;
    
    // they've changed voice channels 
    if ( oldMember.voiceChannel && !newMember.voiceChannel )
    {
      server.release();
    }
    else if ( oldMember.voiceChannel.id != newMember.voiceChannel.id )
    {
      server.switchVoiceChannels(newMember.voiceChannel);
    }      
  }
  catch(ex) { Common.error(ex); }
});

// when messages come in
bot.on('message', message => {
  try {

    var server = world.servers[message.guild.id];

    if (server == null) {
      Common.error("Can't find server for guild id: " + message.guild.id);
      return null;
    }
    
    // is the message a command?
    if (message.content.substring(0, commands.command_char.length) == commands.command_char) {

      server.resetNeglectTimeout();

      var parts = message.content.match(
        new RegExp("(" + Common.escapeRegExp(commands.command_char) + ")([^ ]+)(.*)", "i")
      );
      
      if (!parts || parts.length < 2) {
        return;
      }

      var cmdChar = parts[1];
      var cmdVerb = parts[2] || null;
      var cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
      var cmdContent = (parts[3] || "").trim();

      if (!cmdVerb || !cmdChar) {
        return;
      }

      var msgDets = new MessageDetails({
        world: world,
        server: server,
        cmdChar: cmdChar,
        cmd: cmdVerb,
        args: cmdArgs,
        content: cmdContent,
        message: message
      });

      var command = commands.get(msgDets.cmd);
      if(!command) return;

      //this is for the new way... v3 of writing commands, so we can use argument destructoring
      if (command instanceof Command) {
        command.execute({input : msgDets});
      } else {
        command.execute.apply(this, [msgDets]);
      }

    } else {
      // say it out loud
      server.speak(message);
    }
  }
  catch(ex) { Common.error(ex); }
});

// capture a whole pile of useful information
bot.on('error', Common.error);
bot.on('guildUnavailable', guild => Common.error('guild unavailable: ' + guild.id));
bot.on('rateLimit',        info  => { Common.error('rate limited'); Common.error(info) });
bot.on('reconnecting',     ()    => Common.error('reconnecting'));
bot.on('resume',           ()    => Common.error('resume'));
bot.on('warn',             info  => Common.error('warn:' + warn));

// ctrl-c
process.on('SIGINT', () => world.kill('SIGINT'));

// something goes wrong we didnt think of or having got around to putting a band-aid fix on
process.on('uncaughtException', function (err) {
  Common.error(err);
  world.kill('uncaughtException: ' + err.message);
});

botStuff.connect();