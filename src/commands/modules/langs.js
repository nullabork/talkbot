/*jshint esversion: 9 */

var tablr = require("tablr"),
  TextToSpeechService = require('@services/TextToSpeechService'),
  Common = require('@helpers/common'),
  auth = require("@auth");

// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: langs
 * sets language user config
 *
 * usage !langs
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function langVoices(msg) {
  var have = {};
  var data = [];
  for ( var k in TextToSpeechService.providers)
  {
    var provider = TextToSpeechService.providers[k];

    var voices = provider.getVoices();
    voices.map(voice => {
      if ( !have[voice.code] ) {
        var l = [
          voice.language,
          voice.code
        ];
        data.push(l);
        have[voice.code] = true;
      }
    });
  }

  var table = tablr.headed(data, ['Lang', 'Code']);
  table = table.replace(/\s\s+/g, ' ');

  msg.il8nResponse('langs.okay', {table : table, example : auth.command_arg + 'mylang au'});
};

var command = new BotCommand({
  command_name: 'langs',
  command_arg: 'l',
  execute: langVoices,
  short_help: 'langs.shorthelp',
  long_help: 'langs.longhelp',
  group: "info"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
