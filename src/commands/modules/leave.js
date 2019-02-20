// models
var BotCommand = require('@models/BotCommand');



function leave(msg, server, world) {
  if (server.isBound() && !server.isMaster(msg.user_id)) {
    msg.response(server.lang('leave.nope'));
  } else {
    server.leaveVoiceChannel();
  }
};


var command = new BotCommand({
  command_name: 'leave',
  execute: leave,
  short_help: 'leave.shorthelp',
  long_help: 'leave.longhelp',
  hidden: true,
  group: "control"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
