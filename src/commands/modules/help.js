// models
var BotCommand = require('@models/BotCommand'),
  CommentBuilder = require('@models/CommentBuilder'),
  Common = require('@helpers/common');


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

  var data = {
    "Quickstart" : [
      "1. join a voice channel",
      "2. type " + cmds.command_char + "follow",
      "3. Type some text and hear the bot speak"
    ],

    "Commands" : {

    },

    "Issues" : [
      'To submit bugs (and shitpost) go to https://github.com/wootosmash/talkbot',
      'To Talk to other humans join our discord https://discordapp.com/invite/NxrPp8g'
    ]
  };

  for (var command in cmds.commands) {
    var cmd = cmds.commands[command];
    if (cmd.hidden) continue;

    var group = cmd.group;
    var groupName = "Misc Commands";

    if(!group){
      group = data[groupName];
      //hack
      continue;
    } else {
      groupName = Common.camelize(group.toLowerCase());
      if(!data.Commands[groupName]) data.Commands[groupName] = {};
      group = data.Commands[groupName];
    }

    group[cmds.command_char + cmds.commands[command].command_name] = server.lang(cmds.commands[command].short_help) + "\n";
  }

  var help = new CommentBuilder({
    data : data
  });

  msg.response(help.out());
};

var command = new BotCommand({
  command_name: 'help',
  execute: help,
  short_help: 'help.shorthelp',
  long_help: 'help.longhelp',
  group: "info"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
