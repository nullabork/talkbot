// models
var BotCommand = require('@models/BotCommand'),
  Common = require("@helpers/common"),
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
    if (key != null) {
      msg.response("Another dev has 20 seconds to type the command `" + auth.command_char + "broadcast " + key + "`");
    }
  }
};

var command = new BotCommand({
  command_name: 'broadcast',
  execute: broadcast,
  short_help: 'broadcast.shorthelp',
  long_help: 'broadcast.longhelp',
  hidden: true,
  group: "admin"
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
