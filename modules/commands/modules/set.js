

var command = function (msg, server) {
  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('set.nope'));
  } else {
    if (!server.messages) {
      server.messages = {};
    }

    var a = msg.message.split(/ +/);
    var cmd = a.shift();

    server.messages[cmd] = a.join(" ");
    msg.response(server.lang('set.okay'));
  }
};

exports.register = function (commands) {
  commands.add('set', command);
};

exports.unRegister = function (commands) {
  commands.remove('set');
};


