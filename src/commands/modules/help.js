var commands_local = null;

function help(msg, server, world) {
  
  var response = "```The available commands are:\n";
  
  for ( var command in commands_local.commands )
    response += commands_local.command_char + command + '\n'; // + ' ' + commands_local.commands[command].usage_help;
  
  response += '```';
  
  console.log(commands_local);
  msg.response(response);
  
};

exports.register = function (commands) {
  commands_local = commands;
  commands.add('help', help);
};

exports.unRegister = function (commands) {
  commands_local = null;
  commands.remove('help');
};
