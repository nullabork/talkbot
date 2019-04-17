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
  if (server.connecting) return msg.il8nResponse('follow.connecting');
  if (server.leaving) return msg.il8nResponse('follow.leaving');
  if (server.isBound()) {
    if (!server.isMaster(msg.user_id)) {
      msg.il8nResponse('follow.nope', { name: msg.boundNick() });
    } else {
      msg.il8nResponse('follow.huh');
    }
  } else {
    var voiceChan = msg.getOwnersVoiceChannel();
    if (server.isServerChannel(voiceChan)) {
      server.setMaster(msg.user_id, msg.username);
      server.joinVoiceChannel(voiceChan);

      msg.il8nResponse('follow.okay');
      
      if (server.getUserSetting(msg.user_id, 'muted')) {
        server.addUserSetting(msg.user_id,'muted',false);
        msg.il8nResponse('mute.unmuted');
      }

    } else {
      msg.il8nResponse('follow.join');
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
  if (server.connecting) return msg.il8nResponse('unfollow.connecting');
  if (server.leaving) return msg.il8nResponse('unfollow.leaving');
  
  if (!server.isBound()) {
    msg.il8nResponse('unfollow.none');
    return;
  }

  if (!msg.ownerIsMaster()) {
    msg.il8nResponse('unfollow.nope');
    return;
  }

  server.release(function() {
    msg.il8nResponse('unfollow.okay');
  });
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

  if (server.connecting) return msg.il8nResponse('sidle.connecting');
  if (server.leaving) return msg.il8nResponse('sidle.leaving');
  
  if (!server.isBound()) {
    msg.il8nResponse('sidle.none');
    return;
  }

  if (!server.canManageTheServer(msg.user_id)) {
    msg.il8nResponse('sidle.nope');
    return;
  }

  server.setMaster(msg.user_id, msg.username);

  var voiceChan = msg.getOwnersVoiceChannel();
  if (voiceChan) {
    server.joinVoiceChannel(voiceChan);
    msg.il8nResponse('sidle.okay');
    
    if (server.getUserSetting(msg.user_id, 'muted')) {
      server.addUserSetting(msg.user_id,'muted',false);
      msg.il8nResponse('mute.unmuted');
    }

  } else {
    msg.il8nResponse('sidle.broken');
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

  if (server.connecting) return msg.il8nResponse('transfer.connecting');
  if (server.leaving) return msg.il8nResponse('transfer.leaving');

  if (!msg.ownerIsMaster() && !server.canManageTheServer(msg.user_id)) {
    msg.il8nResponse('transfer.nopermissions');
    return;
  }

  if (msg.args.length == 0) {
    msg.il8nResponse('transfer.args');
    return;
  }

  var target_ids = msg.getUserIds();
  if (!target_ids || !target_ids.length || target_ids.length > 1) {
    msg.il8nResponse('transfer.args');
    return;
  }

  var user_id = target_ids[0];
  var username = msg.getNick(user_id);

  if ( !username || username == "" ) {
    msg.il8nResponse('transfer.unknownnick');
    return;
  }

  server.setMaster(user_id, username);
  var voiceChan = server.getOwnersVoiceChannel(user_id);
  if (voiceChan) {
    server.joinVoiceChannel(voiceChan);

    msg.il8nResponse('transfer.okay', {
      name : server.getBoundToNick()
    });

  } else {
    msg.il8nResponse('transfer.broken');
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
  order : 3,
  parameters: "user"
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

