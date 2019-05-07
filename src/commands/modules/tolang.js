/*jshint esversion: 9 */

var langMap = require("@helpers/voiceMap");


// models
var BotCommand = require('@models/BotCommand');

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

  var docs = langMap.getLang(msg.args[0]);

  if(!docs || !docs.length) {
    msg.il8nResponse('mylang.no', { lang: msg.args[0]});
    return;
  }

  var doc = docs[0];

  server.addMemberSetting(msg.message.member,'toLanguage', doc.translate);
  server.addMemberSetting(msg.message.member,'language', doc.code);
  var response = server.lang('tolang.okay', { lang: doc.language });

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
