

var command = function (msg, server) {
  msg.response(server.lang('ping.okay'));
};

exports.register = function (commands) {
  commands.add('ping', command);
};

exports.unRegister = function(commands){
  commands.remove('ping');
};