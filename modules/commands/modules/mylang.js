
var langMap = require("../../langmap").instance;

var command = function (msg, server) {
  var args = msg.message.split(/ +/);
  if (args.length == 0) return;

  if (server.isPermitted(msg.user_id)) {
    var lang = args.shift(),
      doc = langMap.get(lang);

    if (doc && doc.code) {
      server.permitted[user_id].language = doc.code;
    }

    msg.response(server.lang('mylang.okay', { lang: doc.code }));
  } else {
    msg.response(sserver.lang('mylang.deny'));
  }
};

exports.register = function (commands) {
  commands.add('mylang', command);
};

exports.unRegister = function (commands) {
  commands.remove('mylang');
};