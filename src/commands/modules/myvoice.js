/*jshint esversion: 9 */

var langMap = require("@helpers/voiceMap");
var Common = require('@helpers/common');

// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: myvoice
 * Set the voice to use
 *
 * usage !myvoice au
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function myVoice(msg) {
  var server = msg.server;

  if(!msg.args || !msg.args.length){
    msg.il8nResponse('myvoice.more', {voice: server.getMemberSetting(msg.message.member, 'name') || 'default'});
    return;
  }

  if(msg.args[0] == 'default'){
    server.addMemberSetting(msg.message.member, 'name', 'default');
    msg.il8nResponse('general.auto', {key: "myvoice"});
    return;
  }

  var found = langMap.getVoice(msg.args[0]);
  if(found && found.length) {
    var doc = found[0];
    server.addMemberSetting(msg.message.member,'name', doc.voice);
    server.addMemberSetting(msg.message.member,'language', doc.code);
    server.deleteMemberSetting(msg.message.member,'toLanguage');
    msg.il8nResponse('myvoice.okay', { voice: msg.args[0] });
  } else {
    msg.il8nResponse('myvoice.no', { voice: msg.args[0] });
    return;
  }
};

var command = new BotCommand({
  command_name: 'myvoice',
  command_arg: 'l',
  execute: myVoice,
  short_help: 'myvoice.shorthelp',
  long_help: 'myvoice.longhelp',
  group: "personalization",
  // parameters: "<voice|alias>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
