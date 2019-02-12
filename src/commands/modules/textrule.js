// models
var BotCommand = require('@models/BotCommand');


/**
 * Command: textrule
 * Adds regular expressions to replace text in messages with other text
 *
 * usage !textrule add search text -> replace text
 *       !textrule del search text 
 *       !textrule list 
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

function textrule(msg, server, world) {

  if (!server.isAdminUserOrServerOwner(msg.user_id)) {
    msg.response(server.lang('textrule.nope'));
    return;
  }
  
  var key = null;
  var repl = null;
 
  if (msg.args[0] == 'add' ) {
    var nextindex = -1;
    for ( var i=1; i < msg.args.length; i++ ) {
      if ( msg.args[i] != '->' ) {
        key += ' ' + msg.args[i];
      }
      else {
        nextindex = i;
        break;
      }
    }
    
    for ( var i=nextindex+1; i < msg.args.length; i++) repl += ' ' + msg.args[i];
    
    if ( !key || !repl )
      msg.response(server.lang('textrule.usage'));
    else {
      server.addTextRule(key, repl);
      msg.response(server.lang('textrule.addokay', {rule: key}));
    }
  }
  else if ( msg.args[0] == 'del' ) {
    for ( var i=0; i < msg.args.length; i++) key += ' ' + msg.args[i];
    if ( !key ) 
      msg.response(server.lang('textrule.usage'));
    else {
      server.removeTextRule(key);
      msg.response(server.lang('textrule.delokay', {rule: key}));
    }
  }
  else if ( msg.args[0] == 'list') {
    if ( server.textrules.length == 0 ) 
      msg.response(server.lang('textrule.norules'));
    else {
      var r = '```';
      for ( var textrule in server.textrules )
        r = r + textrule + ' -> ' + server.textrules[textrule] + '\n';
      r += '```';
      msg.response(r);
    }
  }
  else {
    msg.response(server.lang('textrule.usage'));
  }
};

// hook to do the search and replace
function msgParser(message, user_id, server, world) {
  for ( var textrule in server.textrules )
  {
    var re = new RegExp(textrule, 'gi');
    message = message.replace(re, server.textrules[textrule]);
  }
  return message;
};

var command = new BotCommand({
  command_name: 'textrule',
  execute: textrule,
  hidden: true, // hidden while in testing
  short_help: 'textrule.shorthelp',
  long_help: 'textrule.longhelp',
  listeners: {
    message: msgParser
  },
  
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
