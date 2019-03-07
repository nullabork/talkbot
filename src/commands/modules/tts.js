// models
var BotCommand = require('@models/BotCommand');

function text_to_speech(msg, server, world) {
  
  if ( msg.message.length < 1 ) return;
  if ( Common.isMessageExcluded(msg.message) ) return;
  
  if (!server.inChannel()) {
    msg.response(server.lang('tts.notinchannel'));
    return;
  };

  if (!server.isPermitted(msg.user_id)) {
    msg.response(server.lang('tts.notpermitted'));
    return;
  };
 
  server.speak(msg.message, msg.channel_id, msg.user_id, world);
};

function mute(msg, server, world) {
  if (server.getUserSetting(msg.user_id, 'muted')) {
    msg.response(server.lang('mute.alreadymuted'));
    return;
  };

  server.addUserSetting(msg.user_id,'muted',true);
  msg.response(server.lang('mute.okay'));
};

function unmute(msg, server, world) {
  if (!server.getUserSetting(msg.user_id, 'muted')) {
    msg.response(server.lang('unmute.alreadyunmuted'));
    return;
  };
  
  server.addUserSetting(msg.user_id,'muted',false);
  msg.response(server.lang('unmute.okay'));
};

var command_tts = new BotCommand({
  command_name: 't',
  execute: text_to_speech,
  short_help: 'tts.shorthelp',
  long_help: 'tts.longhelp',
  group: "server",
  hidden: true
});

var command_mute = new BotCommand({
  command_name: 'mute',
  execute: mute,
  short_help: 'mute.shorthelp',
  long_help: 'mute.longhelp',
  group: "server",
  hidden: true
});

var command_unmute = new BotCommand({
  command_name: 'unmute',
  execute: unmute,
  short_help: 'unmute.shorthelp',
  long_help: 'unmute.longhelp',
  group: "server",
  hidden: true
});

exports.register = function (commands) {
  commands.add(command_tts);
  commands.add(command_mute);
  commands.add(command_unmute);
};

exports.unRegister = function (commands) {
  commands.remove(command_tts);
  commands.remove(command_mute);
  commands.remove(command_unmute);
};
