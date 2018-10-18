
var common = require("../../common");

var command = function (msg, server) {
  var args = msg.message.split(/ +/);
  if ( args.length == 0 ) return;

  if ( server.isPermitted(msg.user_id) ) {
    pitch = parseFloat(args[0]);
    pitch = common.clamp(pitch, -20, 20);
    server.permitted[user_id].pitch = pitch;

    msg.response(server.lang('mypitch.okay', { gender : gender }));
  } else {
    msg.response(server.lang('mypitch.deny'));
  }
};

exports.register = function (commands) {
  commands.add('mypitch', command);
};

exports.unRegister = function(commands){
  commands.remove('mypitch');
};
