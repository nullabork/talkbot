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

  var key = '';
  var repl = '';

  // add a rule
  if (msg.args[0] == 'add' ) {
    if (!msg.ownerCanManageTheServer()) {
      msg.response(server.lang('textrule.nope'));
      return;
    }
    
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

    if ( key == '' || repl == '' )
      msg.response(server.lang('textrule.usage'));
    else {
      server.addTextRule(key, repl);
      msg.response(server.lang('textrule.addokay', {rule: key.trim()}));
    }
  }

  // delete a rule
  else if ( msg.args[0] == 'del' ) {
    if (!msg.ownerCanManageTheServer()) {
      msg.response(server.lang('textrule.nope'));
      return;
    }
    
    for ( var i=1; i < msg.args.length; i++) key += ' ' + msg.args[i];
    if ( key == '' )
      msg.response(server.lang('textrule.usage'));
    else {
      server.removeTextRule(key);
      msg.response(server.lang('textrule.delokay', {rule: key.trim()}));
    }
  }

  // list all the rules
  else if ( msg.args[0] == 'list') {
    if (Object.keys(server.textrules).length == 0) 
      msg.response(server.lang('textrule.norules'));
    else {
      var r = '```';
      for ( var textrule in server.textrules )
        r = r + textrule + ' -> ' + server.textrules[textrule] + '\n';
      r += '```';
      msg.response(r);
    }
  }
  
  else if ( msg.args[0] == 'clearall' ) {
    if (!msg.ownerCanManageTheServer()) {
      msg.response(server.lang('textrule.nope'));
      return;
    }
    
    server.clearAllTextRules();
    msg.response(server.lang('textrule.clearallokay'));
  }
  
  else {
    msg.response({embed: {
    color: 3447003,
    author: {
      name: "woot",
      icon_url: null
    },
    title: "This is an embed",
    url: "http://google.com",
    description: "This is a test embed to showcase what they look like and what they can do.",
    fields: [{
        name: "Fields",
        value: "They can have different fields with small headlines."
      },
      {
        name: "Masked links",
        value: "You can put [masked links](http://google.com) inside of rich embeds."
      },
      {
        name: "Markdown",
        value: "You can put all the *usual* **__Markdown__** inside of them."
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: null,
      text: "© Example"
    }
  }
});    
    //msg.response(server.lang('textrule.usage'));
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
