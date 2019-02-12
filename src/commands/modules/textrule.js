// models
var BotCommand = require('@models/BotCommand');


/**
 * Command: mygender
 * sets your gender user config
 *
 * usage !mygender male
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
  
  var key = '';
  var repl = '';
 
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
    
    server.addTextRule(key, repl);
    msg.response(server.lang('textrule.addokay', {rule: key}));
  }
  else if ( msg[0] == 'del' ) {
    for ( var i=0; i < msg.args.length; i++) key += ' ' + msg.args[i];
    server.removeTextRule(key);
    msg.response(server.lang('textrule.delokay', {rule: key}));
  }
  else {
    msg.response(server.lang('textrule.usage'));
  }
};

function msgParser(message, user_id, server, world) {
  console.log(message);
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
  hidden: true,
  short_help: 'textrule.shorthelp',
  long_help: 'textrule.longhelp',
  listeners: {
    // 'sfx.msg.args': sfxPlaySoundListener
    message: msgParser
  },
  
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
