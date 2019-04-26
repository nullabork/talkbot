/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand');

function ping(msg) {
  msg.il8nResponse('ping.okay');
};

var command = new BotCommand({
  command_name: 'ping',
  execute: ping,
  short_help: 'ping.shorthelp',
  long_help: 'ping.longhelp',
  group: "info"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
