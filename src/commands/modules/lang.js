
var langMap = require("../../helpers/langmap");

var command = function (msg, server, world) {
  if (!msg.args.length) return;

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('lang.nope'));
    return;
  }
  var doc = langMap.get(msg.getMessage());

  if (doc && doc.code) {
    server.language = doc.code;
  } else {
    server.language = lang;
  }

  msg.response(server.lang('lang.okay', { lang: server.language }));
};

exports.register = function (commands) {
  commands.add('lang', command);
};

exports.unRegister = function (commands) {
  commands.remove('lang');
};
