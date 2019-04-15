
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
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function listVoices(msg, server, world) {
  // if (server.isPermitted(msg.user_id)) {

    if(!msg.args || !msg.args.length){
      msg.il8nResponse('voices.more');
      return;
    }

    var docs = langMap.getLang(msg.args[0]);

    if(!docs || !docs.length) {
      //what dont know???? why? you should by now...
      msg.il8nResponse('mylang.no', { lang: msg.args[0]});
      return;
    }

    var data = docs.map(function(lang){
      return [
        lang.voice,
        lang.voice_alias,
        lang.gender,
        lang.type == "WaveNet"? "😎" : "🤢"
      ]
    });

    var table = tablr.headed(data, ['Voice', 'Alias', 'Gender', "???"]);
    table = table.replace(/--/g, '━━');

    msg.il8nResponse('voices.okay', {
      table : table,
      example : auth.command_arg + 'myvoice au'
    });

};

var command = new BotCommand({
  command_name: 'voices',
  command_arg: 'l',
  execute: listVoices,
  short_help: 'voices.shorthelp',
  long_help: 'voices.longhelp',
  group: "info",
  parameters: "<lang>"
});


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};
