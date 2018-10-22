var command = function (msg, server) {
  var master_nick = server.getBoundToNick();
  if (!master_nick) {
    msg.response("asdasd");
  } else {
    msg.response(server.lang('who.okay', { name: master_nick }));
  }
};

exports.register = function (commands) {
  commands.add('who', command);
};

exports.unRegister = function (commands) {
  commands.remove('who');
};