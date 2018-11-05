

var command = function (msg, server) {
  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('permit.nope'));
    return;
  }

  var target_ids = msg.getUserIds();
  if (!target_ids || !target_ids.length) {
    msg.response(server.lang('permit.none'));
    return;
  }

  target_ids.forEach(function (target_id) {
    server.permit(target_id);
    var nick = msg.getNick(target_id);
    if (nick) {
      msg.response(server.lang('permit.okay', { name: nick }));
    } else {
      msg.response(server.lang('permit.huh', { name: target_id }));
    }
  });   
  
};

exports.register = function (commands) {
  commands.add('permit', command);
};

exports.unRegister = function (commands) {
  commands.remove('permit');
};