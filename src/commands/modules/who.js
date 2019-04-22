// models
var BotCommand = require('@models/BotCommand');

function who(msg) {
  var server = msg.server;
  if (!server.bound_to) {
    msg.il8nResponse('who.none');
  } else {
    var master_nick = server.bound_to.displayName;
    msg.il8nResponse('who.okay', { name: master_nick });
  } // TODO: Get this to list everyone who's permitted
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
