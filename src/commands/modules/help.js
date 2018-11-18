// models
var BotCommand = require('@models/BotCommand');


/**
 * Command: help
 *
 * lists all the available commands on this bot
 *
 * usage: !help
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

function help(msg, server, world) {

  var cmds = require("@commands");
  var response = "```Quickstart:\n\n\t1. join a voice channel\n\t2. type " + cmds.command_char + "follow\n\t3. Type some text and hear the bot speak\n\nThe full list of commands are:\n\n";

  for (var command in cmds.commands) {
    var cmd = cmds.commands[command];
    if (cmd.hidden) continue;
    response += '\t' + cmds.command_char + cmds.commands[command].command_name + ' - ' + server.lang(cmds.commands[command].short_help) + '\n'; // + ' ' + commands_local.commands[command].short_help;
  }

  response += '\nTo submit bugs (and shitpost) go to https://github.com/wootosmash/talkbot```';

  msg.response(response);
};

var command = new BotCommand({
  command_name: 'help',
  execute: help,
  short_help: 'help.shorthelp',
  long_help: 'help.longhelp',
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
