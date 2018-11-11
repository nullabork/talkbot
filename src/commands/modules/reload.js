function reload (msg, server) {
  if (msg.ownerIsDev()) {
    server.reload();
  }
};

exports.register = function (commands) {
  commands.add('reload', reload);
};

exports.unRegister = function (commands) {
  commands.remove('reload');
};
