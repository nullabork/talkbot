// models 
var BotCommand = require('@models/BotCommand');  


/**
 * Command: permit
 * The bot master can permit authority to other users
 *
 * usage: !permit @username1 @username2
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function permit(msg, server, world) {
  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('permit.nope'));
    return;
  }

  var target_ids = msg.getUserIds();
  if (!target_ids || !target_ids.length) {
    msg.response(server.lang('permit.none'));
    return;
  }

  target_ids.forEach(function (target_id) {
    server.permit(target_id);
    var nick = msg.getNick(target_id);
    if (nick) {
      msg.response(server.lang('permit.okay', { name: nick }));
    } else {
      msg.response(server.lang('permit.huh', { name: target_id }));
    }
  });
};


/**
 * Command: unpermit
 * The bot master can permit authority to other users
 * A person permited may unpermit themselves
 *
 * usage: !unpermit @username1 @username2
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function unpermit(msg, server) {

  if (!server.isPermitted(msg.user_id)) {
    msg.response(server.lang('unpermit.deny'));
    return;
  }

  var target_ids = msg.getUserIds();
  if (!target_ids || !target_ids.length) {
    return;
  }

  //target_ids.forEach(function(target_id) {
  for (let i = 0; i < target_ids.length; i++) {
    var target_id = target_ids[i];

    if (target_id != msg.user_id && !msg.ownerIsMaster()) {
      msg.response(server.lang('unpermit.deny'));

      continue;
    }

    server.unpermit(target_id);

    var nick = msg.getNick(target_id);
    if (!nick) {
      msg.response(server.lang('unpermit.none', { name: target_id }));
    } else {
      msg.response(server.lang('unpermit.okay', { name: nick }));
    }
  }
};

var command_permit = new BotCommand({
  command_name: 'permit',
  execute: permit,
  short_help: 'permit.shorthelp',
  long_help: 'permit.longhelp', 
});

var command_unpermit = new BotCommand({
  command_name: 'unpermit',
  execute: unpermit,
  short_help: 'unpermit.shorthelp',
  long_help: 'unpermit.longhelp', 
});

exports.register = function (commands) {
  commands.add(command_permit);
  commands.add(command_unpermit);
};

exports.unRegister = function (commands) {
  commands.remove(command_permit);
  commands.remove(command_unpermit);
};

