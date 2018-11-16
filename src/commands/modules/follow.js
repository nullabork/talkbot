/* * *
 * Command: follow
 * The bot will listen and respond to command writer if no other person is
 * master
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
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
 * The bot will stop following the command writer is they are the master
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
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



exports.register = function (commands) {
  commands.add('follow', follow);
  commands.add('unfollow', unfollow);
};

exports.unRegister = function (commands) {
  commands.remove('follow');
  commands.remove('unfollow');
};
