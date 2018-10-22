
var langMap = require("../../langmap").instance;

var command = function (msg, server) {
  if (!msg.args.length) return;

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('lang.nope'));
    return;
  }

  var lang = args.shift();
  var doc = langMap.get(lang);

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
