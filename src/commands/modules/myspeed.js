/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand');


var Common = require("@helpers/common");

function speed(msg) {
  var server = msg.server;
  var member = msg.message.member;
  
  if (!msg.args.length) return;

  if(msg.args[0] == 'default'){
    server.addMemberSetting(member, 'speed', 'default');
    msg.il8nResponse('general.auto', {key: "myspeed"});
    return;
  }

  var speed = parseFloat(msg.args[0]);
  speed = Common.numberClamp(speed, 0.25, 4.0);
  server.addMemberSetting(member,'speed',speed);
  msg.il8nResponse('myspeed.okay', { speed: speed });

};

var command = new BotCommand({
  command_name: 'myspeed',
  command_arg: 's',
  execute: speed,
  short_help: 'myspeed.shorthelp',
  long_help: 'myspeed.longhelp',
  group: "personalization",
  parameters: "<speed>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
