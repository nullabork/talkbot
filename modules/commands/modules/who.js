var command = function (msg, server) {
  var master_nick = msg.getOwner();
  if (!master_nick)
    master_nick = server.bound_to;
  if (!master_nick)
    msg.response(server.lang('who.none'));
  else
    msg.response(channel_id, server.lang('who.okay', { name: master_nick }));
};

exports.register = function (commands) {
  commands.add('who', command);
};

exports.unRegister = function(commands){
  commands.remove('who');
};