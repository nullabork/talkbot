/*jshint esversion: 9 */

// require
const TextToSpeechService = require("@services/TextToSpeechService"),
  Common = require('@helpers/common'),
  BotCommand = require('@models/BotCommand');

/**
 * Command: mylang
 * sets language user config
 *
 * usage !mylang au
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function mylang(msg) {

  var server = msg.server;
  var member = msg.message.member;

  if(!msg.args || !msg.args.length){
    msg.il8nResponse('mylang.more');
    return;
  }

  if(msg.args[0] == 'default'){
    server.addMemberSetting(msg.message.member, 'language', 'default');
    server.addMemberSetting(msg.message.member, 'name', 'default');
    msg.il8nResponse('general.auto', {key: "mylang"});
    return;
  }

  var lang_code = msg.args[0];

  if(!TextToSpeechService.isValidLang(lang_code)) {
    //what dont know???? why? you should by now...
    msg.il8nResponse('mylang.no', { lang: lang_code});
    return;
  }

  var voice = TextToSpeechService.getVoiceRecords(lang_code)[0];

  server.addMemberSetting(member,'language', voice.code);

  var response = server.lang('mylang.okay', { lang: voice.language });

  var voiceName = server.getMemberSetting(member,'name');
  if( voiceName && voiceName != "default" ) {
    response += "\n" + server.lang('myvoice.noped');
  }

  server.addMemberSetting(member,'name', 'default');
  msg.response(response);
}

var command = new BotCommand({
  command_name: 'mylang',
  command_arg: 'l',
  execute: mylang,
  short_help: 'mylang.shorthelp',
  long_help: 'mylang.longhelp',
  group: "personalization",
  // parameters: "<lang>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
