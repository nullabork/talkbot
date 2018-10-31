var command = function (msg, server) {
  msg.response("I think you're looking for ther follow command");
};

exports.register = function (commands) {
  commands.add('join', command);
};

exports.unRegister = function (commands) {
  commands.remove('join');
};