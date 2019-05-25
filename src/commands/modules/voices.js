/*jshint esversion: 9 */

var tablr = require("tablr"),
  TextToSpeechService = require('@services/TextToSpeechService'),
  Common = require('@helpers/common'),
  auth = require("@auth");

// models
var BotCommand = require('@models/BotCommand');

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

    if(!msg.args || !msg.args.length){
      msg.il8nResponse('voices.more');
      return;
    }

    var lang_code = msg.args[0].toLowerCase();

    var data = [];
    for ( var k in TextToSpeechService.providers)
    {
      var provider = TextToSpeechService.providers[k];

      var voices = provider.getVoices();
      voices.map(voice => {
        if (voice.code.toLowerCase().indexOf(lang_code) > -1) 
          data.push([
            voice.provider + '/' + voice.voice,
            !voice.voice_alias ? "(none)" : voice.voice_alias,
            voice.gender.substring(0,1).toLowerCase()
          ]);
      });
    }

    var table = tablr.headed(data, ['Voice', 'Alias', 'm/f']);
    table = table.replace(/--/g, '━━');

    msg.il8nResponse('voices.okay', {
      table : table,
      example : auth.command_arg + 'myvoice en-au'
    });

};

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
