/*jshint esversion: 9 */

// require
const TextToSpeechService = require("@services/TextToSpeechService"),
  Common = require('@helpers/common'),
  BotCommand = require('@models/BotCommand');

/**
 * Command: tolang
 * sets language user config
 *
 * usage !tolang au
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function toLang(msg) {

  var server = msg.server;

  if(!msg.args || !msg.args.length){
    msg.il8nResponse('tolang.more');
    return;
  }

  if(/default|off|none|unset|0/.test(msg.args[0])){
    server.addMemberSetting(msg.message.member, 'toLanguage', 'default');
    msg.il8nResponse('general.auto', {key: "tolang"});
    return;
  }

  var lang_code = msg.args[0];

  if(!TextToSpeechService.isValidLang(lang_code)) {
    //what dont know???? why? you should by now...
    msg.il8nResponse('mylang.no', { lang: msg.args[0]});
    return;
  }

  var voices = TextToSpeechService.getVoiceRecords(lang_code);
  var voice = voices[0];

  server.addMemberSetting(msg.message.member,'toLanguage', voice.translate);
  server.addMemberSetting(msg.message.member,'language', voice.code);
  server.addMemberSetting(msg.message.member,'voice_provider', voice.provider);

  var response = server.lang('tolang.okay', { lang: voice.language });

  var voiceName = server.getMemberSetting(msg.message.member,'name');
  if( voiceName && voiceName != "default" ) {
    response += "\n" + server.lang('myvoice.noped');
  }

  server.addMemberSetting(msg.message.member,'name', 'default');
  msg.response(response);
};

var command = new BotCommand({
  command_name: 'tolang',
  command_arg: 't',
  execute: toLang,
  short_help: 'tolang.shorthelp',
  long_help: 'tolang.longhelp',
  group: "personalization",
  // parameters: "<lang>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
