/*jshint esversion: 9 */

const TextToSpeechService = require("@services/TextToSpeechService"),
  Common = require('@helpers/common');

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
  var member = msg.message.member;
  var settings = server.getMemberSettings(member);

  if (!member) return;

  if(!msg.args || !msg.args.length){
    msg.il8nResponse('myvoice.more', {
      provider: settings.voice_provider || 'default', 
      voice:    settings.name           || 'default'
    });
    return;
  }

  if(msg.args[0] == 'default'){
    server.addMemberSetting(member, 'voice_provider', 'default');
    server.addMemberSetting(member, 'name', 'default');
    msg.il8nResponse('general.auto', {key: "myvoice"});
    return;
  }

  var tokens = msg.args[0].split('/');
  if ( tokens.length < 1)
  {
    msg.il8nResponse('myvoice.usage');
    return;
  } 

  var provider = "";
  var voice = "";

  if ( tokens.length == 1 )
    voice = tokens[0];
  else if ( tokens.length >= 2 )
  {
    provider = tokens[0];
    voice = tokens[1];
  }

  var voice_info = TextToSpeechService.getVoice(voice, provider);
  if(voice_info) {
    server.addMemberSetting(member,'voice_provider', voice_info.provider);
    server.addMemberSetting(member,'name', voice_info.voice);
    server.addMemberSetting(member,'language', voice_info.code);
    server.addMemberSetting(member,'gender', voice_info.gender);
    server.deleteMemberSetting(member,'toLanguage');
    msg.il8nResponse('myvoice.okay', { voice: msg.args[0] });
  } else {
    msg.il8nResponse('myvoice.no', { voice: msg.args[0] });
    return;
  }
}

var command = new BotCommand({
  command_name: 'myvoice',
  command_arg: 'l',
  execute: myVoice,
  short_help: 'myvoice.shorthelp',
  long_help: 'myvoice.longhelp',
  group: "personalization"
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
