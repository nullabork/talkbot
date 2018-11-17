// models 
var BotCommand = require('@models/BotCommand');  

function toggle_neglect(msg, server, world) {
  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('toggle_neglect.nope'));
    return;
  }

  if (server.toggleNeglect()) {
    msg.response(server.lang('toggle_neglect.none'));
  } else {
    msg.response(server.lang('toggle_neglect.okay'));
  }
};

var command = new BotCommand({
  command_name: 'toggle_neglect',
  execute: toggle_neglect,
  short_help: 'toggle_neglect.shorthelp',
  long_help: 'toggle_neglect.longhelp', 
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};


