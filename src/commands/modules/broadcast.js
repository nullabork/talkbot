
var common = require("../../helpers/common"),
  auth = require("@auth");

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
    var key = world.broadcast(message, msg.user_id);
    if(key != null) {
      msg.response("Another dev has 8 seconds to type the command `" + auth.command_char + "broadcast " + key + "`");
    }
  }
};

exports.register = function (commands) {
  commands.add('broadcast', broadcast);
};

exports.unRegister = function (commands) {
  commands.remove('broadcast');
};
