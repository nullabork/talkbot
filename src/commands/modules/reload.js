var command = function (msg, server) {
  if (msg.ownerIsDev()) {
    server.reload();
  }
};

exports.register = function (commands) {
  commands.add('reload', command);
};

exports.unRegister = function (commands) {
  commands.remove('reload');
};
