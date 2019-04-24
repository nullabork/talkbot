/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: defaults
 * Clears all the user settings
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function defaults(msg) {

  server.clearMemberSettings(msg.message.member);

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
