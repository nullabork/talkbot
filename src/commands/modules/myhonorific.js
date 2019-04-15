// models
var BotCommand = require('@models/BotCommand');


var Common = require("@helpers/common");
/**
 * Command: myhonorific
 * sets pitch user config
 *
 * usage !myhonorific [title]
 *
 * @param   {[MessageDetails]}  msg  [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function myhonorific(msg, server, world) {
  if (!msg.args.length) return;

  server.addUserSetting(msg.user_id,'myhonorific', msg.args[0]);
  msg.response('myhonorific.okay');
};

var command = new BotCommand({
  command_name: 'myhonorific',
  command_arg: 'p',
  execute: myhonorific,
  short_help: 'myhonorific.shorthelp',
  long_help: 'myhonorific.longhelp',
  group: "personalization",
  parameters: "<pitch>",
  hidden: true
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
