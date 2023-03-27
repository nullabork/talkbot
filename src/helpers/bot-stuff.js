/*jshint esversion: 9 */

const { Client, Events, GatewayIntentBits } = require('discord.js'),
    auth = require('@auth'),
    Common = require('@helpers/common'),
    tl8 = require('@google-cloud/translate');

class BotStuff {
    constructor() {
        Common.out('Setting up client');

        this.auth = auth;
        this.bot = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                //GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                //GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.MessageContent,
            ],
        });
        this.translate_client = new tl8.Translate({
            projectId: 'talk-bork',
        });
    }

    connect() {
        this.bot.login(auth.token);
    }

    isServerOwner(server, member) {
        return server.guild.ownerID == member.id;
    }

    // determines if the user can manage this server
    canManageTheServer(server, member) {
        let rtn =
            member.permissions.has(Discord.Permissions.FLAGS.ADMINISTRATOR) ||
            member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD) ||
            this.isServerOwner(server, member);

        return rtn;
    }

    // determines if a member can manage the bot
    canManageTheBot(server, member) {
        if (!server.adminrole) return false;
        const rtn = member.roles.has(server.adminrole);
        return rtn;
    }

    botHasManageMessagePermissions(server) {
        let botMember = server.guild.members.cache.find((x) => x.id == this.bot.user.id);
        if (!botMember) return Common.error(new Error('Cant find the member object for this bot')); // something went wrong!

        let rtn = botMember.hasPermission(Discord.Permissions.FLAGS.MANAGE_MESSAGES, false, true, true);
        return rtn;
    }

    sendMessage(channel_id, message) {
        let bot = this.bot;

        bot.simulateTyping(channel_id, function () {
            bot.send({
                to: channel_id,
                message: message,
            });
        });
    }
}

module.exports = new BotStuff();
