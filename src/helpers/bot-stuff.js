/*jshint esversion: 9 */

const { Client, Events, GatewayIntentBits, PermissionsBitField } = require('discord.js'),
    auth = require('@auth'),
    Common = require('@helpers/common'),
    tl8 = require('@google-cloud/translate').v2;

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
        return server.guild.ownerId == member.id;
    }

    // determines if the user can manage this server
    canManageTheServer(server, member) {
        let rtn =
            member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
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

        // member

        // let rtn = botMember.hasPermission(PermissionsBitField.Flags.ManageMessages, false, true, true);
        
        return botMember.permissions.has(PermissionsBitField.Flags.ManageMessages, true);
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
