// models
var BotCommand = require('@models/BotCommand');


var Common = require("@helpers/common");

function speed(msg, server, world) {
  var args = msg.message.split(/ +/);
  if (args.length == 0) return;

  if (server.isPermitted(msg.user_id)) {
    var speed = parseFloat(msg.args[0]);
    speed = Common.numberClamp(speed, 0.25, 4.0);
    server.permitted[msg.user_id].speed = speed;

    msg.response(server.lang('myspeed.okay', { speed: speed }));
  } else {
    msg.response(server.lang('myspeed.deny'));
  }
};

var command = new BotCommand({
  command_name: 'myspeed',
  command_arg: 's',
  execute: speed,
  short_help: 'myspeed.shorthelp',
  long_help: 'myspeed.longhelp',
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
