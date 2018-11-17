
var common = require("../../helpers/common");
/**
 * Command: mypitch
 * sets pitch user config
 *
 * usage !mypitch 0
 *
 * -20 - +20
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function mypitch(msg, server, world) {
  if (!msg.args.length) return;

  if (msg.ownerIsPermitted()) {
    var pitch = parseFloat(msg.getMessage()),
      pitch = common.numberClamp(pitch, -20, 20);

    server.permitted[msg.user_id].pitch = pitch;

    msg.response(server.lang('mypitch.okay', { pitch: pitch }));
  } else {
    msg.response(server.lang('mypitch.deny'));
  }
};

exports.register = function (commands) {
  commands.add('mypitch', mypitch);
};

exports.unRegister = function (commands) {
  commands.remove('mypitch');
};
