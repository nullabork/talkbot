

var command = function (msg, server) {
  if (!server.isBound()) {
    msg.response(server.lang('unfollow.none'));
    return;
  }

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('unfollow.nope'));
    return;
  }

  server.release();
  msg.response(server.lang('unfollow.okay'));
};

exports.register = function (commands) {
  commands.add('unfollow', command);
};

exports.unRegister = function (commands) {
  commands.remove('unfollow');
};