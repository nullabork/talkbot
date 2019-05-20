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
    return date.getFullYear() + " - " + date.getMonth() + " - " + date.getDate();
  }
  //make sure all properties are set
  static initStats ({server}) {

    if(!server.stats) server.stats = {};
    if(!server.dailyStats) server.dailyStats = [];

    var latest  = server.dailyStats.length && server.dailyStats[server.dailyStats.length - 1];
    if(!latest || latest.key != Stats.getDailyKey() ) {
      latest = {  key : Stats.getDailyKey() };
      server.dailyStats.push(latest);
    }

    if(!latest.characterCount) latest.characterCount = 0;
    if(!latest.wordCount) latest.wordCount = 0;
    if(!latest.uniqueUsers) latest.uniqueUsers = {};

    if(!server.stats.characterCount) server.stats.characterCount = 0;
    if(!server.stats.wordCount) server.stats.wordCount = 0;
    if(!server.stats.uniqueUsers) server.stats.uniqueUsers = {};
  }

  //take a message and extract parts to add to stats
  static addMessageStats({server, message}) {
    Stats.initStats({server});

    var charCount = message.cleanContent.replace(/\s/g, '').length;
    var wordCount =  message.cleanContent.split(/\s/).length;

    server.stats.characterCount += charCount;
    server.stats.wordCount += wordCount;
    server.stats.uniqueUsers[message.member.id] = true;

    var latest  = server.dailyStats && server.dailyStats.length && server.dailyStats[server.dailyStats.length - 1];
    if (latest) {
      latest.characterCount += charCount;
      latest.wordCount += wordCount;
      latest.uniqueUsers[message.member.id] = true;
    }
  }

  static getServerStats({server}) {
    Stats.initStats({server});
    var daily = [];

    if ( server.dailyStats && server.dailyStats.length ) {
      for (let i = 0; i < Math.min(server.dailyStats.length, 5); i++) {
        daily.push(server.dailyStats[i].characterCount);
      }
    }

    var uniqueUsers = Object.keys(server.stats.uniqueUsers).length;
    return {
      uniqueUsers : uniqueUsers,
      characterCount : server.stats.characterCount,
      //wordCount : server.stats.wordCount,
      dailyCharacterCounts : daily.join(', ')
    }
  }

  static getWorldStats({world, sort, limit}) {
    var stats = [];
    var servers = world.servers;
    servers = Object.values(servers);

    if(sort) servers = servers.sort(sort);
    if(limit) servers = servers.slice(0, limit);

    // for (var id in world.servers) {
    for (const server of servers) {
      stats.push({
        _heading : server.server_name,
        _data : Stats.getServerStats({server})
      });
    }




    return stats;
  }

  execute ({input}) {
    var world = input.world;
    var server = input.server;
    var sortMethod = input.args[0];
    Stats.initStats({server});

    var sort = null;
    switch(sortMethod) {
      case "daily":
        sort = (a,b) => {
          var bds = b.dailyStats && b.dailyStats.length? b.dailyStats[b.dailyStats.length - 1].characterCount : 0;
          var ads = a.dailyStats && a.dailyStats.length? a.dailyStats[a.dailyStats.length - 1].characterCount : 0;
          return  bds - ads;
        }
        break;
      default:
        sort = (a,b) => b.stats.characterCount - a.stats.characterCount;
    }



    var stats = [];

    // show the owner the stats for their server
    if (!input.ownerIsDev()) stats = [Stats.getServerStats({server})];

    // devs can see everything
    else stats = Stats.getWorldStats({world, sort : sort, limit: 6});

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
