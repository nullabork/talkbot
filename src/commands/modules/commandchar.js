/*jshint esversion: 9 */

var Command = require('@models/Command')
  CommentBuilder = require('@models/CommentBuilder'),
  auth = require('@auth'),
  Common = require('@helpers/common');

class CommandChar extends Command {

  get group () {
    return 'server';
  }

  get hidden () {
    return true;
  }

  execute ({input}) {
    var server = input.server;

    if (input.args.length == 0) {
      input.il8nResponse('commandchar.okay');
      return;
    }

    if (!input.ownerCanManageTheServer()) {
      input.il8nResponse('commandchar.usage');
      return;
    }

    if (!input.args[0]) {
      input.il8nResponse('commandchar.usage');
      return;
    }

    server.command_char = input.args[0];    

    input.il8nResponse('commandchar.okay');
  }
}

//registration
exports.register =  (commands) => {
  commands.add(CommandChar.command)
};

exports.unRegister = (commands) => {
  commands.remove(CommandChar.command)
};

exports.class = CommandChar;
