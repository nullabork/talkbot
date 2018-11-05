
var langMap = require("../../langmap").instance;

var command = function (msg, server) {
  

  if (server.isPermitted(msg.user_id)) {
    msg.response(
      JSON.stringify( server.permitted[msg.user_id], null, 4)
    );
  }
};

exports.register = function (commands) {
  commands.add('details', command);
};

exports.unRegister = function (commands) {
  commands.remove('details');
};