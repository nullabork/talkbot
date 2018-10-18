

var command = function (msg, server) {
  if ( !msg.ownerIsMaster()) {
    msg.response(server.lang('permit.nope'));
  }
  else {
    var target_ids = msg.getUserIds();
    if ( target_ids && target_ids.length ) {
      target_ids.forEach(function(target_id) {
        server.permit(target_id);
        var nick = msg.getNick(target_id);
        if ( !nick ) {
          nick = target_id;
          msg.response(server.lang('permit.okay', { name : nick })); 
        }
      });
    }
    else {
      msg.response(server.lang('permit.none', { name : args[0] }));
    }
  }
};

exports.register = function (commands) {
  commands.add('permit', command);
};

exports.unRegister = function(commands){
  commands.remove('permit');
};