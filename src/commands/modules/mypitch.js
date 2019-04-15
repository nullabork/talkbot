// models
var BotCommand = require('@models/BotCommand');


var Common = require("@helpers/common");
/**
 * Command: mypitch
 * sets pitch user config
 *
 * usage !mypitch 0
 *
 * -20 - +20
 *
 * @param   {[MessageDetails]}  msg  [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function mypitch(msg, server, world) {
  if (!msg.args.length) return;

  if(msg.args[0] == 'default'){
    server.addUserSetting(msg.user_id, 'pitch', 'default');
    msg.il8nResponse('general.auto', {key: "mypitch"});
    return;
  }

  var pitch = parseFloat(msg.getMessage()),
      pitch = Common.numberClamp(pitch, -20, 20);

  server.addUserSetting(msg.user_id,'pitch',pitch);
  msg.il8nResponse('mypitch.okay', { pitch: pitch });
};

var command = new BotCommand({
  command_name: 'mypitch',
  command_arg: 'p',
  execute: mypitch,
  short_help: 'mypitch.shorthelp',
  long_help: 'mypitch.longhelp',
  group: "personalization",
  parameters: "<pitch>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
