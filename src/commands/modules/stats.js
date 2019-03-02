// models
var BotCommand = require('@models/BotCommand');
// help builder :D
var HelpBuilder = require('@models/HelpBuilder');


/**
 * Command: stats
 * Adds regular expressions to replace text in messages with other text
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */


//make sure all properties are set
function initStats(server) {
  if(!server.stats) server.stats = {};
  if(!server.stats.characterCount) server.stats.characterCount = 0;
  if(!server.stats.wordCount) server.stats.wordCount = 0;
  if(!server.stats.uniqueUsers) server.stats.uniqueUsers = {

  };

}

//take a message and extract parts to add to stats
function addMessageStats(server, user_id, message ) {
  initStats(server);
  server.stats.characterCount += message.replace(/\s/g, '').length;
  server.stats.wordCount += message.split(/\s/).length;
  server.stats.uniqueUsers[user_id] = true;
}

//take a server and or all the bits to extract stats.
/**
 *
 * @return {
 *  uniqueUsers : <number> count of each server user settings,
 *  characterCount : <number> accumluated message character while permitted,
 *  wordCount : <number> accumluated message word count while permitted,
 * }
 *
 */
function getServerStats(server){
  initStats(server);
  var uniqueUsers = Object.keys(server.stats.uniqueUsers).length;
  return {
    uniqueUsers : uniqueUsers,
    characterCount : server.stats.characterCount,
    wordCount : server.stats.wordCount
  }
}

//
/**
 * return array of all stats
 *
 * @param   {[World]}  world     [message releated helper functions]
 * @param   {[nullable function]}  sort  [Object related to the Server the command was typed in.]
 * @param   {[number]}  limit   [Object related to the realm and general bot stuff]
 *
 *
 * @return [
 *  ...,
 *  {
 *    name : <STRING> server.name
 *    stats : {
 *      uniqueUsers : <number> count of each server user settings,
 *      characterCount : <number> accumluated message character while permitted,
 *      wordCount : <number> accumluated message word count while permitted,
 *    }
 *  },
 *  ...
 * ]
 */
function getWorldStats(world, sort, limit) {
  var stats = [];
  for (var id in world.servers) {
    var server = world.servers[id];
    stats.push({
      _heading : server.server_name,
      _data : getServerStats(server)
    });
  }

  if(sort) stats = stats.sort(sort);
  if(limit) stats = stats.slice(0, limit);

  return stats;
}

//command stuff
function stats(msg, server, world) {
  initStats(server);
  var stats = getWorldStats(world, (a,b) => b._data.characterCount - a._data.characterCount, 5);

  var help = new HelpBuilder({
    data : { stats  :  stats },
    formatKey : true
  });

  msg.response(help.out());

};;

var command = new BotCommand({
  command_name: 'stats',
  execute: stats,
  short_help: 'stats.shorthelp',
  long_help: 'stats.longhelp',
  listeners: {
    message: function ({modified, message, user_id, server}) {
      //message = modified || message;

      addMessageStats(server, user_id, message);
      return false;
    }
  },
  hidden: true,
  group: "info"
});

exports.initStats = initStats;
exports.addMessageStats = addMessageStats;
exports.getServerStats = getServerStats;
exports.getWorldStats = getWorldStats;


exports.register = function (commands) {
  commands.add(command);
};

exports.unRegister = function (commands) {
  commands.remove(command);
};


