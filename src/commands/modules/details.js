// models
var BotCommand = require('@models/BotCommand'),
  CommentBuilder = require('@models/CommentBuilder');

/**
 * Command: details
 *
 * will print out users details
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function details(msg, server, world) {

  var target_ids = [msg.user_id];

  if (msg.args.length > 0 ) {
    target_ids = msg.getUserIds();
    if (!target_ids || !target_ids.length) {
      target_ids = [msg.user_id];
    }
  }

  let settings = server.getUserSettings(target_ids[0]);

  // prevent people getting the bot booted for spamming
  if(!settings || !Object.keys(settings).length) {
    return msg.response(
      CommentBuilder.create({
        data : {
          "_heading" : server.lang('details.none', {user: target_ids[0]}),
          "_data" : null
        }
      })
    );
  }

  msg.response(
    CommentBuilder.create({
      data : {
        "_heading" :  server.lang('details.for', {user: msg.getNick(target_ids[0]) }),
        "_data" : settings
      },
      keyMap : {
        "name"      : "My Voice",
        "language"  : "My Lang",
        "pitch"     : "My Pitch",
        "speed"     : "My Speed",
        "toLanguage": "To Lang"
      }
    })
  );

};

var command = new BotCommand({
  command_name: 'details',
  execute: details,
  short_help: 'details.shorthelp',
  long_help: 'details.longhelp',
  hidden: true,
  group: "Info",
  parameters: "<user_name>..."
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
