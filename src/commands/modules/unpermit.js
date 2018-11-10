var command = function (msg, server) {

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('unpermit.deny'));
    return;
  }

  var target_ids = msg.getUserIds();
  if (!target_ids || !target_ids.length) {
    return;
  }

  //target_ids.forEach(function(target_id) {
  for (let i = 0; i < target_ids.length; i++) {
    var target_id = target_ids[i];

    if (target_id == msg.user_id) {
      msg.response(server.lang('unpermit.deny'));
      continue;
    }

    server.unpermit(target_id);

    var nick = msg.getNick(target_id);
    if (!nick) {
      msg.response(server.lang('unpermit.okay', { name: target_id }));
    } else {
      msg.response(server.lang('unpermit.none', { name: nick }));
    }
  }
};

exports.register = function (commands) {
  commands.add('unpermit', command);
};

exports.unRegister = function (commands) {
  commands.remove('unpermit');
};