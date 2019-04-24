/*jshint esversion: 9 */
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
 *
 * @return  {[undefined]}
 */
function mypitch(msg) {
  var server = msg.server;

  if (msg.args.length == 0) {
    msg.il8nResponse('mypitch.usage', {gender: server.getMemberSetting(msg.message.member, 'mypitch') });
    return;
  }

  if(msg.args[0] == 'default'){
    server.addMemberSetting(msg.message.member, 'pitch', 'default');
    msg.il8nResponse('general.auto', {key: "mypitch"});
    return;
  }

  var pitch = parseFloat(msg.content),
      pitch = Common.numberClamp(pitch, -20, 20);

  server.addMemberSetting(msg.message.member,'pitch',pitch);
  msg.il8nResponse('mypitch.okay', { pitch: pitch });
};

var command = new BotCommand({
  command_name: 'mypitch',
  command_arg: 'p',
  execute: mypitch,
  short_help: 'mypitch.shorthelp',
  long_help: 'mypitch.longhelp',
  group: "personalization",
  // parameters: "<pitch>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
