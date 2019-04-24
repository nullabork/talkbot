/*jshint esversion: 9 */
// models
var BotCommand = require('@models/BotCommand'),
    CommentBuilder = require('@models/CommentBuilder');

/**
 * Command: details
 *
 * will print out users details
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function details(msg) {

  var target = msg.message.mentions.members.first() || msg.message.member;

  let settings = msg.server.getMemberSettings(target);

  // prevent people getting the bot booted for spamming
  if(!settings || !Object.keys(settings).length) {
    return msg.response(
      CommentBuilder.create({
        data : {
          "_heading" : msg.server.lang('details.none', {user: target.displayName}),
          "_data" : null
        }
      })
    );
  }

  msg.response(
    CommentBuilder.create({
      data : {
        "_heading" : msg.server.lang('details.for', {user: target.displayName }),
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
