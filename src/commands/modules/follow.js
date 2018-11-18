// models
var BotCommand = require('@models/BotCommand');

/* * *
 * Command: follow
 *
 * The bot will listen and respond to command writer if no other person is
 * master
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 * * */
function follow(msg, server, world) {
  if (server.isBound()) {
    if (!server.isMaster(msg.user_id)) {
      msg.response(server.lang('follow.nope', { name: msg.boundNick() }));
    } else {
      msg.response(server.lang('follow.huh'));
    }
  } else {

    server.setMaster(msg.user_id, msg.username);
    var voiceChan = msg.getOwnersVoiceChannel();
    if (voiceChan) {
      server.joinVoiceChannel(voiceChan);
      msg.response(server.lang('follow.okay'));
    } else {
      msg.response(server.lang('follow.nope'));
    }
  }
};

/* * *
 * Command: unfollow
 *
 * The bot will stop following the command writer is they are the master
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 * * */
function unfollow(msg, server, world) {
  if (!server.isBound()) {
    msg.response(server.lang('unfollow.none'));
    return;
  }

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('unfollow.nope'));
    return;
  }

  server.release();
  msg.response(server.lang('unfollow.okay'));
};

/* * *
 * Command: sidle
 *
 * The server admin can sidle into the bot as a permitted person to take over control
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 * * */
function sidle(msg, server, world) {
  if (!server.isBound()) {
    msg.response(server.lang('sidle.none'));
    return;
  }

  if (!server.isAdminUserOrServerOwner(msg.user_id)) { 
    msg.response(server.lang('sidle.nope'));
    return;
  }

  server.setMaster(msg.user_id, msg.username);
  var voiceChan = msg.getOwnersVoiceChannel();
  if (voiceChan) {
    server.joinVoiceChannel(voiceChan);
    msg.response(server.lang('sidle.okay'));
  } else {
    msg.response(server.lang('sidle.nope'));
  }
};

var command_follow = new BotCommand({
  command_name: 'follow',
  execute: follow,
  short_help: 'follow.shorthelp',
  long_help: 'follow.longhelp',
});

var command_unfollow = new BotCommand({
  command_name: 'unfollow',
  execute: unfollow,
  short_help: 'unfollow.shorthelp',
  long_help: 'unfollow.longhelp',
});

var command_sidle = new BotCommand({
  command_name: 'sidle',
  execute: sidle,
  short_help: 'sidle.shorthelp',
  long_help: 'sidle.longhelp',
});

exports.register = function (commands) {
  commands.add(command_follow);
  commands.add(command_unfollow);
  commands.add(command_sidle);
};

exports.unRegister = function (commands) {
  commands.remove(command_follow);
  commands.remove(command_unfollow);
  commands.remove(command_sidle);
};

