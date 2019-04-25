/*jshint esversion: 9 */

var Discord = require('discord.js'),
  auth = require("@auth"),
  Common = require("@helpers/common"),
  tl8 = require('@google-cloud/translate'),
  textToSpeech = require('@google-cloud/text-to-speech');

class BotStuff {

  constructor(shard_number, total_shards) {

    if (!shard_number) shard_number = 0;
    if (!total_shards) total_shards = 1;

    Common.out('Setting up client for shard ID#' + shard_number + '. Total count of shards is ' + total_shards);

    this.auth = auth;
    this.bot = new Discord.Client();

    this.tts_client = new textToSpeech.TextToSpeechClient();

    this.translate_client = new tl8.Translate({
      projectId: "talk-bork",
    });
  }

  connect() {
    this.bot.login(auth.token);
  }

  isServerOwner(server, member) {
    return server.guild.ownerID == member.id;
  };

  // determines if the user can manage this server
  canManageTheServer(server, member) {
    var rtn = (member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR) ||
               member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD) ||
              this.isServerOwner(server, member));

    return rtn;
  };

  botHasManageMessagePermissions(server)
  {
    var botMember = server.guild.members.find( x => x.id == this.bot.user.id);
    if (!botMember) return Common.error(new Error('Cant find the member object for this bot')); // something went wrong!

    var rtn = botMember.hasPermission(Discord.Permissions.FLAGS.MANAGE_MESSAGES, false, true, true);
    return rtn;
  }

  isVoiceChannel(channel) {
    return channel.type == 2;
  }

  getUserVoiceChannel(server_id, user_id) {
    if (!user_id) return;
    if (!server_id) return;

    let bot = this.bot;

    var server = bot.servers[server_id];
    if (!server) return;

    for (var channel in server.channels) {
      var chan = server.channels[channel];
      if (chan.type == 2) {
        for (var member in chan.members) {
          var u = chan.members[member];
          if (u.user_id == user_id) {
            return channel;
          }
        }
      }
    }
    return null;
  };

  resolveMessageSnowFlakes(channel_id, message) {
    var self = this;
    return Common.replaceSnowFlakes(message, function (entity_id) {
      var name = self.findThingsName(channel_id, entity_id);
      return Common.caseToSpace(name);
    })
  }

  sendMessage(channel_id, message) {
    let bot = this.bot;

    bot.simulateTyping(channel_id, function () {
      bot.sendMessage({
        to: channel_id,
        message: message
      });
    });
  };

  tts() {
    return this.tts_client;
  }

  getNickFromUserId(channel_id, user_id) {
    let bot = this.bot;

    if (!bot.channels[channel_id])
      Common.out("getNickFromUserId(): Cant find channel " + channel_id + ", " + user_id);
    else if (!bot.servers[bot.channels[channel_id].guild_id])
      Common.out("getNickFromUserId(): Cant find server " + bot.channels[channel_id].guild_id + " for channel " + channel_id);
    else if (!bot.servers[bot.channels[channel_id].guild_id].members[user_id])
      Common.out("getNickFromUserId(): Cant find member on the server for " + bot.channels[channel_id].guild_id + ", " + user_id);
    else
      return bot.servers[bot.channels[channel_id].guild_id].members[user_id].nick;
    return null;
  };

  findThingsName(channel_id, entity_id) {
    let bot = this.bot;

    var members = bot.servers[bot.channels[channel_id].guild_id].members;
    if (members[entity_id] && members[entity_id].nick) return members[entity_id].nick;
    if (members[entity_id] && members[entity_id].name) return members[entity_id].name;

    if (bot.users && bot.users[entity_id]) return bot.users[entity_id].username;
    if (bot.channels && bot.channels[entity_id]) return bot.channels[entity_id].name;

    var roles = bot.servers[bot.channels[channel_id].guild_id].roles;
    if (roles[entity_id] && roles[entity_id].name) return roles[entity_id].name;

    return null;
  }

  userHasRole(server_id, user_id, role_id){
    let bot = this.bot;
    var server = bot.servers[server_id];
    if (!server) return false;
    if (!server.roles[role_id]) return false;
    var member = server.members[user_id];
    if (!member) return false;
    return member.roles.indexOf(role_id) > -1;
  };

  // see the constants up top
  roleHasPermission(server_id, role_id, permission_bit) {
    let bot = this.bot;
    if (bot.servers[server_id].roles[role_id] == null) return false;
    if (bot.servers[server_id].roles[role_id]._permissions & permission_bit) return true;
    else return false;
  };


  getRole(server_id, roleWord) {
    let bot = this.bot;
    var server = bot.servers[server_id];
    if (!server || !roleWord || !server.roles ) return null;

    let keys = Object.keys(server.roles);

    for (const role_id of keys) {
      let role = server.roles[role_id];
      if(role && role.name && roleWord.toLowerCase() == role.name.toLowerCase()) return role;
    }

    return null;
  }
}

const args = require('yargs').argv;

module.exports = new BotStuff(args.shard_number, args.total_shards);
