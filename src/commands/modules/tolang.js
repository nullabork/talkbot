
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
  var doc = langMap.get(msg.getMessage());

  if(!msg.args || !msg.args.length){
    msg.response(server.lang('mylang.more'));
    return;
  }

  var docs = langMap.getLang(msg.args[0]);

  if(!docs || !docs.length) {
    //what dont know???? why? you should by now...
    msg.response(server.lang('mylang.no', { lang: msg.args[0]}));
    return;
  }

  var doc = docs[0];

  server.addUserSetting(msg.user_id,'toLanguage', doc.translate);
  server.addUserSetting(msg.user_id,'language', doc.code);
  msg.response(server.lang('tolang.okay', { lang: doc.name }));


  var voiceName = server.getUserSetting(msg.user_id,'name');
  if( voiceName && voiceName != "auto" ) {
    response += "\n" + server.lang('myvoice.noped');
  }

  server.addUserSetting(msg.user_id,'name', 'auto');
  msg.response(response);




};

var command = new BotCommand({
  command_name: 'tolang',
  command_arg: 't',
  execute: toLang,
  short_help: 'mylang.shorthelp',
  long_help: 'mylang.longhelp',
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
