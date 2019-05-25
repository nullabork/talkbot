/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand'),
  TextToSpeechService = require('@services/TextToSpeechService'),
  Common = require('@helpers/common');

var lang = function (msg) {
  var server = msg.server;
  if (!msg.args.length) return;

  if (!msg.ownerIsMaster()) {
    msg.il8nResponse('lang.nope');
    return;
  }
  var doc = langMap.get(msg.content);

  if (doc && doc.code) {
    server.language = doc.code;
  } else {
    server.language = lang;
  }

  msg.il8nResponse('lang.okay', { lang: server.language });
  server.save();
};


var command = new BotCommand({
  command_name: 'lang',
  command_arg: 'gl',
  execute: lang,
  short_help: 'lang.shorthelp',
  long_help: 'lang.longhelp',
  group: "personalization",
  hidden: "true"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
