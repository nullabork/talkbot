var command = function (msg, server, world) {
  if (server.isBound()) {
    if (!server.isMaster(msg.user_id))
      msg.response(server.lang('follow.nope', { name: msg.boundNick() }));
    else
      msg.response(server.lang('follow.huh'));
  } else {

    server.setMaster(msg.user_id, msg.username);
    var voiceChan = msg.getOwnersVoiceChannel();
    if (voiceChan) {
      server.joinVoiceChannel(voiceChan);
      msg.response(server.lang('follow.okay'));
    } else {
      msg.response(server.lang('follow.nope'));
    }
  }

};

exports.register = function (commands) {
  commands.add('follow', command);
};

exports.unRegister = function (commands) {
  commands.remove('follow');
};