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
    var voiceChan = msg.getOwnersVoiceChannel();
    if (voiceChan) {
      server.setMaster(msg.user_id, msg.username);
      server.joinVoiceChannel(voiceChan);

      var muted = "";

      if (server.getUserSetting(msg.user_id, 'muted')) {
        muted = "\n" + server.lang('mute.unmuted');
        server.addUserSetting(msg.user_id,'muted',false);
      }

      msg.response(server.lang('follow.okay') + muted);
    } else {
      msg.response(server.lang('follow.join'));
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

  if (!server.canManageTheServer(msg.user_id)) {
    msg.response(server.lang('sidle.nope'));
    return;
  }

  server.setMaster(msg.user_id, msg.username);

  var voiceChan = msg.getOwnersVoiceChannel();
  if (voiceChan) {
    server.joinVoiceChannel(voiceChan);

    var muted = "";

    if (server.getUserSetting(msg.user_id, 'muted')) {
      muted = "\n" + server.lang('mute.unmuted');
      server.addUserSetting(msg.user_id,'muted',false);
    }

    msg.response(server.lang('sidle.okay') + muted);
  } else {
    msg.response(server.lang('sidle.broken'));
  }
};

/* * *
 * Command: transfer
 *
 * The server admin or master can transfer control of the bot to a third party
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 * * */
function transfer(msg, server, world) {

  if (!msg.ownerIsMaster() && !server.canManageTheServer(msg.user_id)) {
    msg.response(server.lang('transfer.nopermissions'));
    return;
  }

  if (msg.args.length == 0) {
    msg.response(server.lang('transfer.args'));
    return;
  }

  var target_ids = msg.getUserIds();
  if (!target_ids || !target_ids.length || target_ids.length > 1) {
    msg.response(server.lang('transfer.args'));
    return;
  }

  var user_id = target_ids[0];
  var username = msg.getNick(user_id);

  if ( !username || username == "" ) {
    msg.response(server.lang('transfer.unknownnick'));
    return;
  }

  server.setMaster(user_id, username);
  var voiceChan = server.getOwnersVoiceChannel(user_id);
  if (voiceChan) {
    server.joinVoiceChannel(voiceChan);

    var muted = "";

    if (server.getUserSetting(msg.user_id, 'muted')) {
      muted = "\n" + server.lang('mute.unmuted');
      server.addUserSetting(msg.user_id,'muted',false);
    }

    msg.response(server.lang('transfer.okay', {
      name : server.getBoundToNick()
    }) + muted);

  } else {
    msg.response(server.lang('transfer.broken'));
  }
};

var command_follow = new BotCommand({
  command_name: 'follow',
  execute: follow,
  short_help: 'follow.shorthelp',
  long_help: 'follow.longhelp',
  group: "control",
  order : 0
});

var command_unfollow = new BotCommand({
  command_name: 'unfollow',
  execute: unfollow,
  short_help: 'unfollow.shorthelp',
  long_help: 'unfollow.longhelp',
  group: "control",
  order : 2
});

var command_sidle = new BotCommand({
  command_name: 'sidle',
  execute: sidle,
  short_help: 'sidle.shorthelp',
  long_help: 'sidle.longhelp',
  group: "control"
});

var command_transfer = new BotCommand({
  command_name: 'transfer',
  execute: transfer,
  short_help: 'transfer.shorthelp',
  long_help: 'transfer.longhelp',
  group: "control",
  order : 3

});

exports.register = function (commands) {
  commands.add(command_follow);
  commands.add(command_unfollow);
  commands.add(command_sidle);
  commands.add(command_transfer);
};

exports.unRegister = function (commands) {
  commands.remove(command_follow);
  commands.remove(command_unfollow);
  commands.remove(command_sidle);
  commands.remove(command_transfer);
};

