
var common = require("../../common");

var command = function (msg, server) {
  console.log("Asd");
  if (!msg.args.length) return;

  if (msg.ownerIsPermitted()) {
    var pitch = parseFloat(msg.args[0]),
      pitch = common.numberClamp(pitch, -20, 20);
    
    server.permitted[msg.user_id].pitch = pitch;

    msg.response(server.lang('mypitch.okay', { pitch: pitch }));
  } else {
    msg.response(server.lang('mypitch.deny'));
  }
};

exports.register = function (commands) {
  commands.add('mypitch', command);
};

exports.unRegister = function (commands) {
  commands.remove('mypitch');
};
