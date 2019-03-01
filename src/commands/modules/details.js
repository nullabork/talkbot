// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: details
 *
 * will print out users details
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function details(msg, server, world) {
  
  var target_ids = [];
  
  if (msg.args.length > 0 )
  {
    target_ids = msg.getUserIds();
    if (!target_ids || !target_ids.length) {
      target_ids = [msg.user_id];
    }
  }
  
  // prevent people getting the bot booted for spamming
  if ( target_ids.length > 1 ) return;
  
  for( var i=0;i<target_ids.length;i++) {
    msg.response(
      JSON.stringify(server.getUserSettings(target_ids[i]), null, 4)
    );
  }
};

var command = new BotCommand({
  command_name: 'details',
  execute: details,
  short_help: 'details.shorthelp',
  long_help: 'details.longhelp',
  hidden: true,
  group: "Info"
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
