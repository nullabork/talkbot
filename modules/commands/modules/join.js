var command = function (msg, server) {
  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('join.nope'));
  } else {
    var voiceChan = server.getOwnersVoiceChannel(msg.user_id);
    if (voiceChan) {
      server.joinVoiceChannel(voiceChan);
    } else {
      msg.response(server.lang('join.none'));
    }
  }
};

exports.register = function (commands) {
  commands.add('join', command);
};

exports.unRegister = function (commands) {
  commands.remove('join');
};