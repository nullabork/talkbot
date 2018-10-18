

var command = function (msg, server) {
  if ( server.isBound() ) {
    if ( !msg.ownerIsMaster()) {
      msg.response( server.lang('unfollow.nope'));
    }
    else {
      server.release();
      msg.response(server.lang('unfollow.okay'));
    }
  }
  else
    msg.response(server.lang('unfollow.none'));

};

exports.register = function (commands) {
  commands.add('unfollow', command);
};

exports.unRegister = function(commands){
  commands.remove('unfollow');
};