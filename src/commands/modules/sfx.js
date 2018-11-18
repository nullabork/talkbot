
// models
var BotCommand = require('@models/BotCommand');


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

function sfx(msg, server, world) {

  if (!msg.message) return;

  if (!server.isAdminUserOrServerOwner(msg.user_id)) {
    msg.response(server.lang('sfx.nope'));
    return;
  }

  if (common.isURL(msg.message)) {
    if (msg.message.length < 5) return;
    if (msg.message.substring(0, 5) != 'https') msg.response(server.lang('sfx.needshttps'));
    else server.talk(common.makeAudioSSML(msg.message), server.permitted[msg.user_id]);
  }
  else {

    if (!server.audioEmojis) server.audioEmojis = {};

    // i cant even
    if (msg.args.length > 3) msg.response(server.lang('sfx.noper')); // why can't I set all the default lang in this file?

    // multiple commands
    else if (msg.args.length == 1) {

      var sfx_command = msg.args[0];

      // wtf
      if (!sfx_command) msg.response(server.lang('sfx.nosfx'));

      // list all the SFX available
      else if (sfx_command == 'list') {

        var rsp = "```";

        for (var e in server.audioEmojis)
          rsp += e + "\t\t" + server.audioEmojis[e] + "\n";

        rsp += "```";

        msg.response(rsp);
      }

      // play a specific SFX
      else if (server.audioEmojis[sfx_command])
        server.talk(common.makeAudioSSML(server.audioEmojis[sfx_command]), server.permitted[msg.user_id]);
    }

    // delete an emoji from this server
    else if (msg.args.length == 2) {
      if (msg.args[0] != 'del' || msg.args[0] != 'delete' || msg.args[0] != 'rm' || msg.args[0] != 'remove') msg.response(server.lang('sfx.nodelete'));
      var emoji_name = msg.args[1];
      delete server.audioEmojis[emoji_name];
      world.save();
    }

    // set an emoji on this server
    else {
      if (msg.args[0] != 'set') msg.response(server.lang('sfx.noset'));
      var emoji_name = msg.args[1];
      var emoji_url = msg.args[2];

      if (emoji_url.length < 5) return;
      if (emoji_url.substring(0, 5) != 'https') msg.response(server.lang('sfx.needshttps'));
      else {
        server.audioEmojis[emoji_name] = emoji_url;
        world.save();
        msg.response(server.lang('sfx.setokay'));
      }
    }

  }
};

// // listen to the normal text flow, if an emoji we have a sound for pops up, play it
// function sfxPlaySoundListener(message, user_id, server, world) {

//   if (!server.isPermitted(user_id)) return;

//   var parts = message.split(' ');

//   for (var part in parts) {
//     var emoji = parts[part];
//     if (server.audioEmojis[emoji])
//       server.talk(
//         common.makeAudioSSML(server.audioEmojis[emoji]),
//         server.permitted[user_id]
//       );
//   }
// };

function sfxParser(token, server) {
  if (server.audioEmojis[token]) {
    return common.makeAudioSSML(server.audioEmojis[token]);
  }
};

var command = new BotCommand({
  command_name: 'sfx',
  execute: sfx,
  short_help: 'sfx.shorthelp',
  long_help: 'sfx.longhelp',
  listeners: {
    // 'sfx.msg.args': sfxPlaySoundListener
    token: sfxParser
  },

  // langs here?
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
