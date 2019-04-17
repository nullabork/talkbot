// models
var BotCommand = require('@models/BotCommand');


// this probably needs to be made into like !langset set set.nope "my fancy message"

function set(msg, server, world) {
  if (!msg.ownerIsMaster()) {
    msg.il8nResponse('set.nope');
    return;
  }

  if (!server.messages) {
    server.messages = {};
  }

  var parts = msg.message.match(/(\S+\.\S+)\s+(.*)/i);

  server.messages[parts[1]] = parts[2];
  msg.il8nResponse('set.okay', { lang: parts[1] });

};

var command = new BotCommand({
  command_name: 'set',
  execute: set,
  short_help: 'set.shorthelp',
  long_help: 'set.longhelp',
  hidden: true,
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
