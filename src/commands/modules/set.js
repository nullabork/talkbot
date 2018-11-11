

function set(msg, server) {
  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('set.nope'));
    return;
  }

  if (!server.messages) {
    server.messages = {};
  }

  var parts = msg.message.match(/(\S+\.\S+)\s+(.*)/i);

  server.messages[parts[1]] = parts[2];
  msg.response(server.lang('set.okay', { lang: parts[1] }));

};

exports.register = function (commands) {
  commands.add('set', set);
};

exports.unRegister = function (commands) {
  commands.remove('set');
};


