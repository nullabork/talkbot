/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand'),
  TextToSpeechService = require('@services/TextToSpeechService'),
  Common = require('@helpers/common');

var lang = function (msg) {
  var server = msg.server;
  if (!msg.args.length) return;

  if (!msg.ownerCanManageTheServer()) {
    msg.il8nResponse('lang.nope');
    return;
  }

  var voices = TextToSpeechService.getVoiceRecords(msg.content);
  if (voices.length == 0) 
    server.language = server.fallbackLang;
  else 
    server.language = voices[0].translate;

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
