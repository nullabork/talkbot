
var langMap = require("@helpers/langmap");

// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: tolang
 * sets language user config
 *
 * usage !tolang au
 *
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function mylang(msg, server, world) {
  if (server.isPermitted(msg.user_id)) {
    var doc = langMap.get(msg.getMessage());

    if (doc && doc.code && doc.translate) {
      server.permitted[msg.user_id].toLanguage = doc.translate;
      server.permitted[msg.user_id].language = doc.code;

      msg.response(server.lang('tolang.okay', { lang: doc.name }));
    } else {

      msg.response(server.lang('tolang.nope', { lang: msg.getMessage() }));
    }


  } else {
    msg.response(server.lang('tolang.deny'));
  }
};

var command = new BotCommand({
  command_name: 'tolang',
  execute: mylang,
  short_help: 'mylang.shorthelp',
  long_help: 'mylang.longhelp',
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
