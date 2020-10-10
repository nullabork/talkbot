// models
const CommentBuilder = require("@models/CommentBuilder"),
  Common = require("@helpers/common");

/**
 * Command: help
 *
 * lists all the available commands on this bot
 *
 * usage: !help
 *
 * @param   {[MessageDetails]}  input     [message releated helper functions]
 *
 * @return  {[undefined]}
 */

class Help extends Command {
  base(server) {
    const cmds = require("@commands");
    return {
      Quickstart: [
        "1. join a voice channel",
        "2. type " + cmds.getCommandChar(server) + "follow",
        "3. Type 'Hello World' to hear the bot speak",
        "4. Choose a voice with " + cmds.getCommandChar(server) + "voices",
      ],

      Control: {},

      Personalization: {},

      More: {},

      Issues: [
        "Documentation:    https://nullabork.gitbook.io/talkbot/",
        "Join our discord: https://discord.com/invite/NxrPp8g",
      ],
    };
  }

  commandRow(cmd, server) {
    let cmdParamenters = "",
      cmds = require("@commands");

    if (cmd.parameters) cmdParamenters = ` ${cmd.parameters}`;

    return {
      [cmds.getCommandChar(server) + cmd.command_name + cmdParamenters]:
        server.lang(cmd.short_help) + "\n",
    };
  }

  groupHelp(g, server) {
    const self = this,
      c = null,
      cmds = require("@commands");

    for (let command in cmds.commands) {
      let cmd = cmds.commands[command],
        group = cmd.group;

      if (cmd.hidden) continue;

      if (!group) continue;

      if (group.toLowerCase() != g.toLowerCase()) continue;

      if (!c) c = {};

      c = {
        ...c,
        ...self.commandRow(cmd, server),
      };
    }

    if (!c) {
      return {
        "Available help groups": [
          cmds.getCommandChar(server) + self.command_name + " personalization",
          cmds.getCommandChar(server) + self.command_name + " control",
          cmds.getCommandChar(server) + self.command_name + " info",
          cmds.getCommandChar(server) + self.command_name + " server",
        ],
      };
    }

    return {
      [Common.camelize(g)]: c,
    };
  }

  execute({ input }) {
    let server = input.server || input.world.servers[auth.supportServer.id]; // if no server, use the support server
    let other = input.args[0],
      self = this,
      cmds = require("@commands"),
      data = this.base(server);

    if (other) {
      return input.response(
        CommentBuilder.create({
          data: self.groupHelp(other, server),
        })
      );
    }

    for (let command in cmds.commands) {
      let cmd = cmds.commands[command];
      if (cmd.hidden) continue;

      let group = cmd.group;
      if (!group) continue;
      group = group.toLowerCase();

      if (group == "personalization" || group == "control") {
        group = Common.camelize(group);
        if (!data[group]) data[group] = {};

        let cmdParamenters = "";
        if (cmd.parameters) cmdParamenters = ` ${cmd.parameters}`;
        data[group][
          cmds.getCommandChar(server) + cmd.command_name + cmdParamenters
        ] = server.lang(cmd.short_help) + "\n";
      } else {
        data["More"][
          cmds.getCommandChar(server) + this.command_name + " " + group
        ] = group + " help commands";
      }
    }

    input.response(
      CommentBuilder.create({
        data: data,
      })
    );
  }
}

//registration
exports.register = (commands) => {
  commands.add(Help.command);
};

exports.unRegister = (commands) => {
  commands.remove(Help.command);
};

exports.class = Help;
