/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand');


/**
 * Command: permit
 * The bot master can permit authority to other users
 *
 * usage: !permit @username1 @username2
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function permit(msg) {
  var server = msg.server;

  if (!msg.ownerIsMaster()) {
    msg.il8nResponse('permit.nope');
    return;
  }

  if ( msg.message.mentions.members.size == 0 ) {
    msg.il8nResponse('permit.none');
    return;
  }

  msg.message.mentions.members.tap( member => server.permit(member.id));
  msg.message.mentions.roles.tap( role => server.permit(role.id));

  var nicks = Common.replaceLast(msg.getDisplayNamesAsCSV(), ', ', ' and ');

  msg.il8nResponse('permit.okay', { name: nicks });
};


/**
 * Command: unpermit
 * The bot master can permit authority to other users
 * A person permited may unpermit themselves
 *
 * usage: !unpermit @username1 @username2 @role1
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function unpermit(msg) {

  var server = msg.server;

  if (!msg.ownerIsPermitted()) {
    msg.il8nResponse('unpermit.deny');
    return;
  }

  if ( msg.message.mentions.members.size == 0 ) {
    server.unpermit(msg.message.member.id);
  }

  msg.message.mentions.members.tap( member => {
    if (member.id != msg.message.member.id && !msg.ownerIsMaster()) {
      msg.il8nResponse('unpermit.deny');
      return;
    }

    server.unpermit(member.id);
  });

  msg.message.mentions.roles.tap( role => {
    if (!msg.ownerIsMaster()) {
      msg.il8nResponse('unpermit.deny');
      return;
    }

    server.unpermit(role.id);
  });

  var nicks = Common.replaceLast(msg.getDisplayNamesAsCSV(), ', ', ' and ');
  msg.il8nResponse('unpermit.okay', { name: nicks });
};

var command_permit = new BotCommand({
  command_name: 'permit',
  execute: permit,
  short_help: 'permit.shorthelp',
  long_help: 'permit.longhelp',
  group: "control",
  // parameters: "[<user>]",
  order : 5

});

var command_unpermit = new BotCommand({
  command_name: 'unpermit',
  execute: unpermit,
  short_help: 'unpermit.shorthelp',
  long_help: 'unpermit.longhelp',
  group: "control",
  // parameters: "[<user>]",
  order : 6
});

exports.register = function (commands) {
  commands.add(command_permit);
  commands.add(command_unpermit);
};

exports.unRegister = function (commands) {
  commands.remove(command_permit);
  commands.remove(command_unpermit);
};

