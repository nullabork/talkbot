

function ping (msg, server) {
  msg.response(server.lang('ping.okay'));
};

exports.register = function (commands) {
  commands.add('ping', ping);
};

exports.unRegister = function (commands) {
  commands.remove('ping');
};
