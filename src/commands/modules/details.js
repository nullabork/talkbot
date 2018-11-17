// models 
var BotCommand = require('@models/BotCommand');  

/**
 * Command: details
 *
 * will print out users details
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function details(msg, server, world) {
  if (server.isPermitted(msg.user_id)) {
    msg.response(
      JSON.stringify(server.permitted[msg.user_id], null, 4)
    );
  }
};

var command = new BotCommand({
  command_name: 'details',
  execute: details,
  short_help: 'details.shorthelp',
  long_help: 'details.longhelp', 
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
