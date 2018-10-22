var command = function (msg, server) {
  if (msg.ownerIsDev()) {
    server.kill();
  }
};

exports.register = function (commands) {
  commands.add('debugbork', command);
};

exports.unRegister = function (commands) {
  commands.remove('debugbork');
};
