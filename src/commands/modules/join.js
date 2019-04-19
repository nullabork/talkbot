// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: join
 * need to fix this command,
 * will make the bot join you if its not following
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */

function join(msg) {
  msg.response("I think you're looking for the follow command");
};

var command = new BotCommand({
  command_name: 'join',
  execute: join,
  short_help: 'join.shorthelp',
  long_help: 'join.longhelp',
  hidden: true,
  //group: "control"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
