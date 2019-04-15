
var langMap = require("@helpers/voiceMap");

// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: tolang
 * sets language user config
 *
 * usage !tolang au
 *
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function toLang(msg, server, world) {

  if(!msg.args || !msg.args.length){
    msg.il8nResponse('mylang.more');
    return;
  }

  if(msg.args[0] == 'default'){
    server.addUserSetting(msg.user_id, 'toLanguage', 'default');
    msg.il8nResponse('general.auto', {key: "tolang"});
    return;
  }

  var docs = langMap.getLang(msg.args[0]);

  if(!docs || !docs.length) {
    //what dont know???? why? you should by now...
    msg.il8nResponse('mylang.no', { lang: msg.args[0]});
    return;
  }

  var doc = docs[0];

  server.addUserSetting(msg.user_id,'toLanguage', doc.translate);
  server.addUserSetting(msg.user_id,'language', doc.code);
  var response = server.lang('tolang.okay', { lang: doc.language });


  var voiceName = server.getUserSetting(msg.user_id,'name');
  if( voiceName && voiceName != "default" ) {
    response += "\n" + server.lang('myvoice.noped');
  }

  server.addUserSetting(msg.user_id,'name', 'default');
  msg.response(response);
};

var command = new BotCommand({
  command_name: 'tolang',
  command_arg: 't',
  execute: toLang,
  short_help: 'tolang.shorthelp',
  long_help: 'tolang.longhelp',
  group: "personalization",
  parameters: "<lang>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
