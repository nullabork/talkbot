var Discord = require('discord.io'),
    auth = require("../config/auth.json");

class BotStuff {
  constructor() {
    this.auth = auth;
    this.bot = new Discord.Client({
      token: auth.token,
      autorun: true
    });
  }

  isVoiceChannel (channel_id) {
    if (!channel_id) return false;
    return (this.bot.channels[channel_id].type == 2);
  }

  getUserVoiceChannel(user_id) {
    if (!user_id) return;

    let bot = this.bot;

    for (var server in bot.servers) {
      for (var channel in bot.servers[server].channels) {
        var chan = bot.servers[server].channels[channel];
        if (chan.type == 2) {
          for (var member in chan.members) {
            var u = chan.members[member];
            if (u.user_id == user_id) return channel;
          }
        }
      }
    }
    return null;
  };

  isUserInVoiceChannel(user_id) {
    if ( !user_id ) return false;
    return this.getUserVoiceChannel(user_id) != null;
  };

  sendMessage(channel_id, message) {
    let bot = this.bot;

    bot.simulateTyping(channel_id, function() {
      bot.sendMessage({
          to: channel_id,
          message: message
      });
    });
  };

  getNickFromUserId ( channel_id, user_id ) {
    let bot = this.bot;

    if ( !bot.channels[channel_id] )
      console.log("getNickFromUserId(): Cant find channel " + channel_id + ", " + user_id);
    else if ( !bot.servers[bot.channels[channel_id].guild_id] )
      console.log("getNickFromUserId(): Cant find server " + bot.channels[channel_id].guild_id + " for channel " + channel_id);
    else if ( !bot.servers[bot.channels[channel_id].guild_id].members[user_id] )
      console.log("getNickFromUserId(): Cant find member on the server for " + bot.channels[channel_id].guild_id + ", " + user_id);
    else
      return bot.servers[bot.channels[channel_id].guild_id].members[user_id].nick;
    return null;
  };

  findThingsName (channel_id, entity_id) {
    let bot = this.bot;

    if(bot.users && bot.users[IDref]) return bot.users[IDref].username;
    if(bot.channels && bot.channels[IDref]) return bot.channels[IDref].name;
    
    var roles = bot.servers[bot.channels[channel_id].guild_id].roles;
    if ( roles[entity_id] && roles[entity_id].name ) return role.name;

    var members = bot.servers[bot.channels[channel_id].guild_id].members;
    if ( members[entity_id] && members[entity_id].name ) return members.name;

    return null;
  }

}

module.exports = new BotStuff();