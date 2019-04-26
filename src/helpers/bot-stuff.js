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
