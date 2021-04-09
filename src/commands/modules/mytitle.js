/*jshint esversion: 9 */
// models
const BotCommand = require("@models/BotCommand");

/**
 * Command: mytitle
 * sets title user config
 *
 * usage !mytitle [title]
 *
 * @param   {[MessageDetails]}  msg  [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function mytitle(msg) {
  if (!msg.args.length) {
    msg.il8nResponse("mytitle.read");
    return;
  }

  msg.server.addMemberSetting(msg.message.member, "mytitle", msg.content);
  msg.il8nResponse("mytitle.set");
}

var command = new BotCommand({
  command_name: "mytitle",
  command_arg: "p",
  execute: mytitle,
  short_help: "mytitle.shorthelp",
  long_help: "mytitle.longhelp",
  group: "personalization",
  // parameters: "<title>",
  hidden: true,
});

exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
