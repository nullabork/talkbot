/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand');

function who(msg) {
  var server = msg.server;
  if (!server.bound_to) {
    msg.il8nResponse('who.none');
  } else {
    var master_nick = server.bound_to.displayName;
    msg.il8nResponse('who.okay', { mymaster: master_nick, permitted: build_permitted_string(server) });
  } 
}

function build_permitted_string(server) {
  var members = '';
  for( var id in server.permitted ) {
    var member = server.guild.members.find(x => x.id == id);
    if ( server.permitted[id] ) {
      if ( id != server.bound_to.id) {
        if ( member ) members += ', (permitted)' + member.displayName;
        else {  
          var role = server.guild.roles.find(x => x.id == id);
          if ( role ) members += ', (permitted role)' + role.name;
          else members += ', ' + id;
        }
      }
    }
    else 
    {
      if ( member ) members += ', (unpermitted)' + member.displayName;
    }
  }
  if ( members.length < 2 ) return 'no one else';
  return members.trim().substring(2);
}

var command = new BotCommand({
  command_name: 'who',
  execute: who,
  short_help: 'who.shorthelp',
  long_help: 'who.longhelp',
  group: "server"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
