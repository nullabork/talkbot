
var langMap = require("@helpers/voiceMap");

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
function defaults(msg, server, world) {

  server.clearUserSettings(msg.user_id);

  msg.il8nResponse('defaults.okay');

};

var command = new BotCommand({
  command_name: 'defaults',
  command_arg: 'd',
  execute: defaults,
  short_help: 'defaults.shorthelp',
  long_help: 'defaults.longhelp',
  group: "personalization"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
