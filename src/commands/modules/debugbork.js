function kill(msg, server, world) {
  if (msg.ownerIsDev()) {
    server.kill();
  }
};

exports.register = function (commands) {
  commands.add('debugbork', kill);
};

exports.unRegister = function (commands) {
  commands.remove('debugbork');
};
