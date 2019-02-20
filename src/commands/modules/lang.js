// models
var BotCommand = require('@models/BotCommand');


var langMap = require("@helpers/langmap");

var lang = function (msg, server, world) {
  if (!msg.args.length) return;

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('lang.nope'));
    return;
  }
  var doc = langMap.get(msg.getMessage());

  if (doc && doc.code) {
    server.language = doc.code;
  } else {
    server.language = lang;
  }

  msg.response(server.lang('lang.okay', { lang: server.language }));
  world.save();
};


var command = new BotCommand({
  command_name: 'lang',
  command_arg: 'gl',
  execute: lang,
  short_help: 'lang.shorthelp',
  long_help: 'lang.longhelp',
  group: "personalization"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
