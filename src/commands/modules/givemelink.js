// models
var auth = require("@auth");
var Common = require("@helpers/common");
var BotCommand = require('@models/BotCommand');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

/**
 * Command: givemelink
 * breaks off some raw internet and sends it to you
 *
 * usage !givemelink
 *
 * @param   {[MessageDetails]}  msg  [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function givemelink(msg, server, world) {

  if (!auth.givemelink) msg.response(server.lang('givemelink.noconfig'));
  else {
    // when you want to define this per server or user, change this bit
    // and pull out the config testing or use that as a fall back
    var fetchoUri = auth.givemelink.endpoint;
    
    var request = require('request');
    request(fetchoUri, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var url = JSON.parse(body);
        msg.response(url[getRandomInt(0, url.length)]["Uri"]);
      }
      else {
        msg.response(server.lang('givemelink.error'));
      }
    });
  }
};

function testConfig()
{
  if (auth.givemelink && !auth.givemelink.endpoint)
  {
    console.log('givemelink.endpoint is not configured in auth.json');
    process.exit(1);
  }
  else if (auth.givemelink)
  {
    console.log('givemelink endpoint configured to ' + auth.givemelink.endpoint);
  }
}

var command = new BotCommand({
  command_name: 'givemelink',
  startup: testConfig,
  execute: givemelink,
  short_help: 'givemelink.shorthelp',
  long_help: 'givemelink.longhelp',
  hidden: !auth.givemelink
});

var commanda = new BotCommand({
  command_name: 'g',
  startup: testConfig,
  execute: givemelink,
  short_help: 'givemelink.shorthelp',
  long_help: 'givemelink.longhelp',
  hidden: true
});

exports.register = function (commands) {
  commands.add(command);
  commands.add(commanda);
};

exports.unRegister = function (commands) {
  commands.remove(command);
  commands.remove(commanda);
};
