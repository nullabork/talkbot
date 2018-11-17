function who(msg, server, world) {
  var master_nick = server.getBoundToNick();
  if (!master_nick) {
    msg.response(server.lang('who.none'));
  } else {
    msg.response(server.lang('who.okay', { name: master_nick }));
  }
};

exports.register = function (commands) {
  commands.add('who', who);
};

exports.unRegister = function (commands) {
  commands.remove('who');
};
