// models
var BotCommand = require('@models/BotCommand');
var Common = require('@helpers/common');
var botStuff = require('@helpers/bot-stuff');
var bot = botStuff.bot;

/**
 * Command: debugbork
 *
 * Allows the dev to kill the server if required
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function kill(msg, server, world) {
  if (msg.ownerIsDev()) {
    world.kill('debugbork');
  }
};

/**
 * Command: ohshit
 *
 * Allows any user to save a state file for later examination by the devs
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function ohshit(msg, server, world) {
  if (!msg.ownerIsDev()) msg.il8nResponse('ohshit.nope');
  else {

    var fs = require('fs');
    var paths = require('@paths');
    var botStuff = require("@helpers/bot-stuff");
    var bot = botStuff.bot;
    var util = require('util');
    var d = new Date();

    server.save(paths.config + '/ohshit' + (d.getTime()) + '.json');

    function replacer(key, value) {
      if (key.endsWith("_timeout")) return undefined; // these keys are internal timers that we dont want to save
      if (key == "commandResponses") return undefined;
      if (key == "world") return undefined;
      else return value;
    };

    _filename = paths.config + '/ohshit-world-' + (d.getTime()) + '.json';
    fs.writeFileSync(_filename, JSON.stringify(world, replacer), 'utf-8');

    _filename = paths.config + '/ohshit-bot-' + (d.getTime()) + '.json';
    fs.writeFileSync(_filename, util.inspect(bot), 'utf-8');

    msg.il8nResponse('ohshit.okay');
  }
};

function debug(msg, server, world) {

  if (!msg.ownerIsDev()) return;

  var member_count = 0;
  var c = 0;
  for (var s in world.servers) {
    if (world.servers[s].isBound()) c++;
    member_count += Object.keys(bot.servers[s].members).length;
  }

  var r = "Active: " + c + "\n";
  r += "Servers: " + Object.keys(world.servers).length + "\n";
  r += "Total members: " + member_count + "\n";
  
  r += "\nActive Servers:\n";
  for (var s in world.servers) {
    if (world.servers[s].isBound()) r += world.servers[s].server_name + " - " + build_permitted_string(world.servers[s]) + "\n";
  }

  msg.response(r);
};

function build_permitted_string(server) {
  var users = '';
  for( var id in server.permitted ) {
    prefix = id == server.bound_to ? '(master)' : '';
    var member = bot.servers[server.server_id].members[id];
    if ( member ) users += ' ' + prefix + (member.nick ? member.nick : (bot.users[id] ? bot.users[id].username : id));
    else {
      var role = bot.servers[server.server_id].roles[id];
      if ( role ) users += ' ' + role.name;
      else users += ' ' + id;
    }
  }
  return users.trim();
};

var command_kill = new BotCommand({
  command_name: 'debugbork',
  execute: kill,
  short_help: 'debugbork.shorthelp',
  long_help: 'debugbork.longhelp',
  hidden: true,
});

var command_ohshit = new BotCommand({
  command_name: 'ohshit',
  execute: ohshit,
  short_help: 'ohshit.shorthelp',
  long_help: 'ohshit.longhelp',
  hidden: true,
  group: "admin"
});

var command_debug = new BotCommand({
  command_name: 'debug',
  execute: debug,
  short_help: 'debug.shorthelp',
  long_help: 'debug.longhelp',
  hidden: true,
  group: "admin"
});

exports.register = function (commands) {
  commands.add(command_kill);
  commands.add(command_ohshit);
  commands.add(command_debug);
};

exports.unRegister = function (commands) {
  commands.remove(command_kill);
  commands.remove(command_ohshit);
  commands.remove(command_debug);
};
