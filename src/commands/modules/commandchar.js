/*jshint esversion: 9 */

const Command = require("@models/Command");

class CommandChar extends Command {
  get group() {
    return "server";
  }

  get hidden() {
    return true;
  }

  execute({ input }) {
    const server = input.server;

    if (input.args.length == 0) {
      input.il8nResponse("commandchar.okay");
      return;
    }

    if (!input.ownerCanManageTheServer()) {
      input.il8nResponse("commandchar.usage");
      return;
    }

    if (!input.args[0]) {
      input.il8nResponse("commandchar.usage");
      return;
    }

    server.command_char = input.args[0];

    input.il8nResponse("commandchar.okay");
  }
}

//registration
exports.register = (commands) => {
  commands.add(CommandChar.command);
};

exports.unRegister = (commands) => {
  commands.remove(CommandChar.command);
};

exports.class = CommandChar;
