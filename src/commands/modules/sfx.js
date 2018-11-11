function sfx(msg, server) {

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('sfx.nope'));
    return;
  }

  if (!msg.message) {
    msg.response(server.lang('sfx.nope'));
    return;
  }

  if (common.isMessageExcluded(message)) {
    var ssml = "<speak><audio src='" + msg.message + "' /></speak>";

    server.talk(ssml, server.permitted[msg.user_id]);
  }
  else {
    if (!server.audioEmojis) server.audioEmojis = [];
    if (msg.args.length == 1) msg.response(server.audioEmojis[msg.args[0]]);
    else {
      server.audioEmojis[msg.args.shift()] = msg.args.join();
      server.world.save();
    }
  }
};

exports.register = function (commands) {
  commands.add('sfx', sfx);
};

exports.unRegister = function (commands) {
  commands.remove('sfx');
};
