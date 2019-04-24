/*jshint esversion: 9 */

var tablr = require("tablr");
var langMap = require("@helpers/voiceMap");
var Common = require('@helpers/common');
var auth = require("@auth");

// models
var BotCommand = require('@models/BotCommand');

/**
 * Command: mylang
 * sets language user config
 *
 * usage !mylang au
 *
 * US
 * NL
 * AU
 * GB
 * FR
 * CA
 * DE
 * IT
 * JP
 * KR
 * BR
 * ES
 * SE
 * TR
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */
function langVoices(msg) {
  var docs = langMap.voices;
  var have = {};
  var data = docs.filter(function(obj){
    if(have[obj.code]){
      return false;
    }

    have[obj.code] = true;
    return true;

  }).map(function(lang){
    return [
      lang.language,
      lang.code.toLowerCase(),
      lang.code.toLowerCase().split('-')[1]
    ]
  });

  var table = tablr.headed(data, ['Lang', 'Code', 'Alt']);
  table = table.replace(/--/g, '━━');

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
