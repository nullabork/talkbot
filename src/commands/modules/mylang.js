
var langMap = require("../../helpers/langmap");

var command = function (msg, server) {
  if (server.isPermitted(msg.user_id)) {

    // /console.log(lang,, "<-- lang");
    // /var msg = msg.args;
    //msg.trim().split( /\s+/ );

    var doc = langMap.get(msg.args[0]);

    if (doc && doc.code) {
      server.permitted[msg.user_id].language = doc.code;
    }

    msg.response(server.lang('mylang.okay', { lang: doc.code }));
  } else {
    msg.response(server.lang('mylang.deny'));
  }
};

exports.register = function (commands) {
  commands.add('mylang', command);
};

exports.unRegister = function (commands) {
  commands.remove('mylang');
};