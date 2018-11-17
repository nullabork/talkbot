// models 
var BotCommand = require('@models/BotCommand');  

/**
 * Command: debugbork
 *
 * Allows the dev to kill the server if required
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function kill(msg, server, world) {
  if (msg.ownerIsDev()) {
    server.kill();
  }
};

/**
 * Command: ohshit
 *
 * Allows any user to save a state file for later examination by the devs
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function ohshit(msg, server, world) {
  if ( !msg.ownerIsMaster()) msg.response(server.lang('ohshit.nope'));
  else {
    world.save('./ohshit'+(new Date().getTime()) + '.json');
    msg.response(server.lang('ohshit.okay'));
  }
};

var command_kill = new BotCommand({
  command_name: 'debugbork',
  execute: kill,
  short_help: 'debugbork.shorthelp',
  long_help: 'debugbork.longhelp', 
  hidden: true,
});

var command_ohshit = new BotCommand({
  command_name: 'ohshit',
  execute: ohshit,
  short_help: 'ohshit.shorthelp',
  long_help: 'ohshit.longhelp', 
  hidden: true,
});

exports.register = function (commands) {
  commands.add(command_kill);
  commands.add(command_ohshit);
};

exports.unRegister = function (commands) {
  commands.remove(command_kill);
  commands.remove(command_ohshit);
};
