// models
var BotCommand = require('@models/BotCommand');


var Common = require("@helpers/common");
/**
 * Command: mytitle
 * sets title user config
 *
 * usage !mytitle [title]
 *
 * @param   {[MessageDetails]}  msg  [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function mytitle(msg, server, world) {
  if (!msg.args.length)
  {
    msg.il8nResponse('mytitle.read');
    return;
  }

  server.addUserSetting(msg.user_id,'mytitle', msg.message);
  msg.il8nResponse('mytitle.set');
};

var command = new BotCommand({
  command_name: 'mytitle',
  command_arg: 'p',
  execute: mytitle,
  short_help: 'mytitle.shorthelp',
  long_help: 'mytitle.longhelp',
  group: "personalization",
  parameters: "<title>",
  hidden: true
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};