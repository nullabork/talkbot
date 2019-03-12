// models
var Command = require('@models/Command'),
  auth = require('@auth'),
  CommentBuilder = require('@models/CommentBuilder'),
  Common = require('@helpers/common');


/**
 * Command: help
 *
 * lists all the available commands on this bot
 *
 * usage: !help
 *
 * @param   {[MessageDetails]}  input     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

class Help extends Command {

  get base() {
    return {
      "Quickstart" : [
        "1. join a voice channel",
        "2. type " + auth.command_char + "follow",
        "3. Type some text and hear the bot speak"
      ],

      "Control" : {

      },

      "Personalization" : {

      },

      "More" : {

      },

      "Issues" : [
        'To submit bugs (and shitpost) go to https://github.com/wootosmash/talkbot',
        'To Talk to other humans join our discord https://discordapp.com/invite/NxrPp8g'
      ]
    };
  }

  commandRow(cmd,  server) {

    let cmdParamenters = "",
      cmds = require("@commands");

      if(cmd.parameters) cmdParamenters = ` ${cmd.parameters}`;

    return {
      [cmds.command_char + cmd.command_name + cmdParamenters] : server.lang(cmd.short_help) + "\n"
    }
  }

  groupHelp (g, server) {

    var self = this,
      c = null,
      cmds = require("@commands");

    for (var command in cmds.commands) {
      var cmd = cmds.commands[command],
        group = cmd.group;

      if (cmd.hidden)
        continue;

      if(!group)
        continue;

      if(group.toLowerCase() != g.toLowerCase())
        continue;

      if(!c) c = {}

      c = {
        ...c,
        ...self.commandRow(cmd, server)
      }
    }

    if(!c) {
      return {
       'Available help groups' : [
        cmds.command_char + self.command_name + ' personalization',
        cmds.command_char + self.command_name + ' control',
        cmds.command_char + self.command_name + ' info',
        cmds.command_char + self.command_name + ' server'
       ]
      }
    }

    return {
      [Common.camelize(g)] : c
    }
  }


  execute ({input, server, world}) {

    var other = input.args[0],
      self = this,
      cmds = require("@commands"),
      data = this.base;

    if(other){

      return input.response(CommentBuilder.create({
        data : self.groupHelp(other, server)
      }));
    }

    for (var command in cmds.commands) {
      var cmd = cmds.commands[command];
      if (cmd.hidden) continue;

      var group = cmd.group;
      if(!group) continue;
        group = group.toLowerCase();

      if(group == 'personalization' || group == 'control') {
        group = Common.camelize(group);
        if(!data[group]) data[group] = {};

        let cmdParamenters = "";
        if(cmd.parameters) cmdParamenters = ` ${cmd.parameters}`;
        data[group][cmds.command_char + cmd.command_name + cmdParamenters] = server.lang(cmd.short_help) + "\n";
      }
      else
      {
        data['More'][cmds.command_char + this.command_name + " " + group] = group + " help commands";
      }
    }

    input.response(CommentBuilder.create({
      data : data
    }));
  }
}

//registration
exports.register =  (commands) => {
  commands.add(Help.command)
};

exports.unRegister = (commands) => {
  commands.remove(Help.command)
};

exports.class = Help;

