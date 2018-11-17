// models
var BotCommand = require('@models/BotCommand');



function ping(msg, server, world) {
  msg.response(server.lang('ping.okay'));
};

var command = new BotCommand({
  command_name: 'ping',
  execute: ping,
  short_help: 'ping.shorthelp',
  long_help: 'ping.longhelp',
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
