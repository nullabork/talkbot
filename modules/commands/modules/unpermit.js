var command = function (msg, server) {

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('unpermit.deny'));
  } else {
    var target_ids = msg.getUserIds();
    if (target_ids && target_ids.length) {
      //target_ids.forEach(function(target_id) {
      for (let index = 0; index < target_ids.length; index++) {
        const target_id = target_ids[index];

        if (target_id == message.user_id || !server.isMaster(target_id)) {
          msg.response(server.lang('unpermit.nope'));
        }

        server.unpermit(target_id);
        var nick = msg.getNick(target_id);
        if (!nick) {
          msg.response(server.lang('unpermit.okay', { name: target_id }));
        } else {
          msg.response(server.lang('unpermit.none', { name: nick }));
        }
      }
    }
  }
};

exports.register = function (commands) {
  commands.add('unpermit', command);
};

exports.unRegister = function (commands) {
  commands.remove('unpermit');
};