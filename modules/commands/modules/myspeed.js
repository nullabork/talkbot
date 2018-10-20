
var common = require("../../common");

var command = function (msg, server) {
  var args = msg.message.split(/ +/);
  if ( args.length == 0 ) return;

  if ( server.isPermitted(msg.user_id) ) {
    speed = parseFloat(args[0]);
    speed = common.numberClamp(pitch, 0.25, 4.0);
    server.permitted[user_id].speed = speed;

    msg.response(server.lang('myspeed.okay', { gender : gender }));
  } else {
    msg.response(server.lang('myspeed.deny'));
  }
};

exports.register = function (commands) {
  commands.add('myspeed', command);
};

exports.unRegister = function(commands){
  commands.remove('myspeed');
};
