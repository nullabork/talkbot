/*jshint esversion: 9 */

const tt = require("text-table"),
  TextToSpeechService = require('@services/TextToSpeechService'),
  Common = require('@helpers/common'),
  commands = require('@commands'),
  auth = require("@auth");

// models
const BotCommand = require('@models/BotCommand');

/**
 * Command: mylang
 * sets language user config
 *
 * usage !mylang au
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function listVoices(msg) {

  const exampleEmbed = {
    color: 0x0099ff,
    title: `Click to find voices${msg.content ? " for: " +msg.content + "." : "."}`,
    url: `https://voices.talkbot.dev/?chr=${encodeURI(commands.getCommandChar(msg.server))}&find=${encodeURI(msg.content)}`,
    description: 'talkbot voice and voice sample database.',
    thumbnail: {
      url: 'https://voices.talkbot.dev/img/face_200.png',
    }
  };

  msg.richResponse(exampleEmbed);
}

var command = new BotCommand({
  command_name: 'voices',
  command_arg: 'l',
  execute: listVoices,
  short_help: 'voices.shorthelp',
  long_help: 'voices.longhelp',
  group: "info"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
