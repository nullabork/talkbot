
// models
var BotCommand = require('@models/BotCommand'),
  common = require('@helpers/common'),
  MessageDetails = require('@models/MessageDetails');


/**
 * Command: sfx
 *
 * controls the sfx functionality for messages. Note this command only works for masters
 *
 * usage: !sfx set [emoji_name] [url] - set an emoji. When a permitted person uses this emoji it'll play the sound
 * usage: !sfx del [emoji_name]       - unset an emoji. See set
 * usage: !sfx [url]                  - play a sound url once
 * usage: !sfx list                   - show all emojis available on this server
 * usage: !sfx [emoji_name]           - play this emoji
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

function cmds(msg, server, world) {

  // if (!msg.message) return;

  // if (!server.canManageTheServer(msg.user_id)) {
  //   msg.response(server.lang('sfx.nope'));
  //   return;
  // }

  var args = common.parseArguments(msg.getMessage());
  var commands = require('@commands');
  for (var sCmd of args) {

    var cmdArgs = (sCmd.value && sCmd.value.trim().split(/\s+/)) || [];
    var cmdMessage = (sCmd.value || "").trim()

    var msgDets = new MessageDetails({
      channel_id: msg.channel_id,
      user_id: msg.user_id,
      bot: msg.bot,
      world: world,
      server: server,
      username: msg.username,
      cmdChar: msg.cmdChar,
      cmd: sCmd.name,
      args: cmdArgs,
      message: cmdMessage,
    });

    //var cmd = commands.get(sCmd.name);
    commands.run(msgDets.cmd, [msgDets, server, world]);
  }
};

var command = new BotCommand({
  command_name: 'cmds',
  execute: cmds,
  short_help: 'cmds.shorthelp',
  long_help: 'cmds.longhelp'
});

exports.register = function (commands) {
  //commands.add(command);
};

exports.unRegister = function (commands) {
  //commands.remove(command);
};
