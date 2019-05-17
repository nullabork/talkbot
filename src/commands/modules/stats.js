/*jshint esversion: 9 */
/**
 * Command: stats
 * shows some stuff
 */


var Command = require('@models/Command'),
  CommentBuilder = require('@models/CommentBuilder'),
  Common = require('@helpers/common');

class Stats extends Command {

  // core COMMAND getters
  get group () {
    return 'info';
  }

  get hidden () {
    return true;
  }

  static getDailyKey() {
    var date = new Date();
    return date.getFullYear() + " - " + date.getMonth() + " - " + date.getDay();
  }
  //make sure all properties are set
  static initStats ({server}) {



    if(!server.stats) server.stats = {};
    if(!server.dailyStats) server.dailyStats = [];

    var latest  = server.dailyStats.length && server.dailyStats[server.dailyStats.length - 1];

    if(!latest || latest.ket != Stats.getDailyKey() ) {
      latest = {  key : Stats.getDailyKey() };
      server.dailyStats.push(latest);
    }


    if(!latest.characterCount) daily.characterCount = 0;
    if(!latest.wordCount) daily.wordCount = 0;
    if(!latest.uniqueUsers) daily.uniqueUsers = {};

    if(!server.stats.characterCount) server.stats.characterCount = 0;
    if(!server.stats.wordCount) server.stats.wordCount = 0;
    if(!server.stats.uniqueUsers) server.stats.uniqueUsers = {

    };
  }

  //take a message and extract parts to add to stats
  static addMessageStats({server, message}) {
    Stats.initStats({server});

    var charCount = message.cleanContent.replace(/\s/g, '').length;
    var wordCount =  message.cleanContent.split(/\s/).length;

    server.stats.characterCount += charCount;
    server.stats.wordCount += wordCount;
    server.stats.uniqueUsers[message.member.id] = true;

    // var daily = server.dailyStats[Stats.getDailyKey];
    var latest  = server.dailyStats && server.dailyStats.length && server.dailyStats[server.dailyStats.length - 1];
    if (latest) {
      latest.characterCount += charCount;
      latest.wordCount += wordCount;
      latest.uniqueUsers[message.member.id] = true;
    }
  }

  static getServerStats({server}){
    Stats.initStats({server});
    var daily = [];

    if ( server.dailyStats && server.dailyStats.length ) {
      for (let i = 0; i < Math.min(server.dailyStats.length, 5); i++) {
        daily.push(server.dailyStats[i]);
      }
    }

    var uniqueUsers = Object.keys(server.stats.uniqueUsers).length;
    return {
      uniqueUsers : uniqueUsers,
      characterCount : server.stats.characterCount,
      wordCount : server.stats.wordCount,
      dailyCharacterCounts : daily.join(', ')
    }
  }

  static getWorldStats({world, sort, limit}) {
    var stats = [];
    for (var id in world.servers) {
      var server = world.servers[id];
      stats.push({
        _heading : server.server_name,
        _data : Stats.getServerStats({server})
      });
    }

    if(sort) stats = stats.sort(sort);
    if(limit) stats = stats.slice(0, limit);

    return stats;
  }

  execute ({input}) {
    var world = input.world;
    var server = input.server;

    Stats.initStats({server});
    var stats = [];

    // show the owner the stats for their server
    if (!input.ownerIsDev()) stats = [Stats.getServerStats({server})];

    // devs can see everything
    else stats = Stats.getWorldStats({world, sort : (a,b) => b._data.characterCount - a._data.characterCount, limit: 5});

    var help = new CommentBuilder({
      data : { stats  :  stats },
      formatKey : true
    });

    input.response(help.out());
  }

  onMessage({message, server}) {
    Stats.addMessageStats({server, message});
    return null;
  }
}

//registration
exports.register = (commands) => {
  commands.add(Stats.command)
};

exports.unRegister = (commands) => {
  commands.remove(Stats.command)
};

exports.Stats = Stats;
