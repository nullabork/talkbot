// models
var BotCommand = require('@models/BotCommand');


function who(msg, server, world) {
  var master_nick = server.bound_to_username;
  if (!master_nick) {
    msg.il8nResponse('who.none');
  } else {
    msg.il8nResponse('who.okay', { name: master_nick });
  }
};

var command = new BotCommand({
  command_name: 'who',
  execute: who,
  short_help: 'who.shorthelp',
  long_help: 'who.longhelp',
  group: "server"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
