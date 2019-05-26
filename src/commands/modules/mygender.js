/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: mygender
 * sets your gender user config
 *
 * usage !mygender male
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */

function mygender(msg) {
  var server = msg.server;
  if (msg.args.length == 0) {
    msg.il8nResponse('mygender.usage', {gender: server.getMemberSetting(msg.message.member, 'gender') || 'default' });
    return;
  }

  if(msg.args[0] == 'default'){
    server.addMemberSetting(msg.message.member, 'gender', 'default');
    msg.il8nResponse('general.auto', {key: "mygender"});
    return;
  }

  var gender = msg.content.trim();
  if (/^(boy|bud|chap|bloke|man|dude|m|male)$/i.test(gender)) {
    gender = "MALE";
  } else if (/^(girl|feminine|lady|gal|women|chick|f|female)$/i.test(gender)) {
    gender = "FEMALE";
  } else {
    gender = "FEMALE";
  }

  server.addMemberSetting(msg.message.member,'gender',gender);

  var response = server.lang('mygender.okay', { gender: gender });
  var voiceName = server.getMemberSetting(msg.message.member,'name');
  if( voiceName && voiceName != "default" ) {
    response += "\n" + server.lang('myvoice.noped');
  }

  server.addMemberSetting(msg.message.member, 'name', 'default');
  msg.response(response);
};

var command = new BotCommand({
  command_name: 'mygender',
  command_arg: 'g',
  execute: mygender,
  short_help: 'mygender.shorthelp',
  long_help: 'mygender.longhelp',
  group: "personalization",
  // parameters: "<gender>"
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
