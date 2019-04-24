/*jshint esversion: 9 */
/*
 *  _____     _ _    ____        _
 * |_   _|_ _| | | _| __ )  ___ | |_
 *   | |/ _` | | |/ /  _ \ / _ \| __|
 *   | | (_| | |   <| |_) | (_) | |_
 *   |_|\__,_|_|_|\_\____/ \___/ \__|
 *
 * A discord text to speech bot
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

var bot = botStuff.bot;

// runtime testing
testing.TestIfChildProcessIsWorkingHowDiscordJSNeedsItTo();
testing.TestIfGoogleEnvironmentVarIsSet();
testing.TestIfNodeOpusIsInstalled();
// TODO: Test node-opus is installed, the call above does nothing

// FANCY SPLASH SCREEN
figlet('TalkBot', (err, data) => console.log(data));

// when the server is ready to go
bot.on('ready', () => {
  Common.out('Logged in as: ' + bot.user.username + ' - (' + bot.user.id + ')');
  world.startup();
});

// when the bot is added to new servers
bot.on('guildCreate', guild => {
  try {
    //add the relationships
    world.addServer(guild);
  }
  catch(ex) { Common.error(ex); }
});

// when the bot is removed from servers
bot.on('guildDelete', guild => {
  try {
    world.removeServer(guild);
  }
  catch(ex) { Common.error(ex); }
});

// when a member is removed unfollow
bot.on('guildMemberRemove', member => {
  if (server.isMaster(member))
  {
    server.release();
  }
});

// handle voice state updates
bot.on('voiceStateUpdate', (oldMember, newMember) => {
  if (!oldMember) return;
  
  try {
    var server = world.servers[oldMember.guild.id];
    if (!server.isMaster(oldMember))
      return;
    
    // they've changed voice channels 
    if ( oldMember.voiceChannel && !newMember.voiceChannel || oldMember.voiceChannel.id != newMember.voiceChannel.id) {
      server.release();
    }
/*    else if ( oldMember.voiceChannel.id != newMember.voiceChannel.id )
    {
      server.switchVoiceChannels(newMember.voiceChannel);
    }      */
  }
  catch(ex) { Common.error(ex); }
});

// when messages come in
bot.on('message', message => {
  try {
    if ( message.member.id == bot.user.id ) return;

    var server = world.servers[message.guild.id];

    if (server == null) {
      Common.error("Can't find server for guild id: " + message.guild.id);
      return null;
    }
    
    // is the message a command?
    if (commands.isCommand(message)) {
      commands.process(message, server, world);
    } else {
      // say it out loud
      server.speak(message);
    }
  }
  catch(ex) { Common.error(ex); }
});

// when messages are edited
/*bot.on('messageUpdate', (oldMessage, newMessage) => {
  if ( newMessage.member.id == bot.user.id ) return;

  var server = world.servers[newMessage.guild.id];

  if (server == null) {
    Common.error("Can't find server for guild id: " + newMessage.guild.id);
    return null;
  }

  // is the message a command?
  if (commands.isCommand(newMessage)) {
    commands.process(newMessage, server, world);
  } else {
    // say it out loud
    server.speak(newMessage);
  }
});*/

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

// capture a whole pile of useful information
bot.on('error',            Common.error);
bot.on('guildUnavailable', guild => Common.error('guild unavailable: ' + guild.id));
bot.on('rateLimit',        info  => { Common.error('rate limited'); Common.error(info) });
bot.on('reconnecting',     ()    => Common.error('reconnecting'));
bot.on('resume',           ()    => Common.error('resume'));
bot.on('warn',             info  => Common.error('warn:' + warn));

// ctrl-c
process.on('SIGINT', () => world.kill('SIGINT'));

// something goes wrong we didnt think of or having got around to putting a band-aid fix on
process.on('uncaughtException', err => { Common.error(err); world.kill('uncaughtException: ' + err.message); });

// start it up!
botStuff.connect();