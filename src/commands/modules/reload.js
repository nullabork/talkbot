// models
var BotCommand = require('@models/BotCommand');



function reload(msg, server, world) {
  if (msg.ownerIsDev()) {
    server.reload();
  }
};

var command = new BotCommand({
  command_name: 'reload',
  execute: reload,
  short_help: 'reload.shorthelp',
  long_help: 'reload.longhelp',
  hidden: true,
  group: "control"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
