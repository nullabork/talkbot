/*jshint esversion: 9 */

var Command = require('@models/Command'),
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder');

class Break extends Command {

    get group () {  return 'personalization'; }
    get hidden () { return true; }

    execute ({input}) {
        var server = input.server;
        var member = input.message.member;

        server.guild.voiceConnection.authentication.secretKey = void 0;

    }
}

//registration
exports.register =  (commands) => {
    commands.addAll([
      Break.command
    ]);
};

exports.unRegister = (commands) => {
    commands.removeAll([
      Break.command,
    ]);
};

exports.Break = Break;
