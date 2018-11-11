
var common = require("../../helpers/common");

/**
 * Command: broadcast
 *
 * broadcast messages to all the servers.
 *
 * usage: !broadcast message
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

function broadcast(msg, server, world) {
  if (msg.ownerIsDev()) {
    var message = msg.getMessage();
    world.broadcast(message);
  }
};

exports.register = function (commands) {
  commands.add('broadcast', broadcast);
};

exports.unRegister = function (commands) {
  commands.remove('broadcast');
};
