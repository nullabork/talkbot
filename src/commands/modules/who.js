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
    if ( server.permitted[id] ) {
      var member = server.guild.members.find(x => x.id == id);
      if (  member.id != server.bound_to.id) {
        if ( member ) members += ', ' + member.displayName;
        else {  
          var role = server.guild.roles.find(x => x.id == id);
          if ( role ) members += ', (role)' + role.name;
          else members += ', ' + id;
        }
      }
    }
  }
  if ( members.length < 2 ) return '';
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
