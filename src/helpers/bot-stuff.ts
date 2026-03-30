export {};

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const config = require('../config-loader');
const Common = require('@helpers/common');
const tl8 = require('@google-cloud/translate').v2;
import { env } from '../env';

class BotStuff {
    config: any;
    bot: any;
    translate_client: any;

    constructor() {
        Common.out('Setting up client');

        this.config = config;
        this.bot = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
            ],
        });
        this.translate_client = new tl8.Translate({
            projectId: 'talk-bork',
        });
    }

    connect(): void {
        this.bot.login(env.DISCORD_TOKEN);
    }

    isServerOwner(server: any, member: any): boolean {
        return server.guild.ownerId == member.id;
    }

    canManageTheServer(server: any, member: any): boolean {
        const rtn =
            member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
            this.isServerOwner(server, member);

        return rtn;
    }

    canManageTheBot(server: any, member: any): boolean {
        if (!server.adminrole) return false;
        const rtn = member.roles.has(server.adminrole);
        return rtn;
    }

    botHasManageMessagePermissions(server: any): boolean | void {
        const botMember = server.guild.members.cache.find((x: any) => x.id == this.bot.user.id);
        if (!botMember) return Common.error(new Error('Cant find the member object for this bot'));

        return botMember.permissions.has(PermissionsBitField.Flags.ManageMessages, true);
    }

    sendMessage(channel_id: string, message: string): void {
        const bot = this.bot;

        bot.simulateTyping(channel_id, function () {
            bot.send({
                to: channel_id,
                message: message,
            });
        });
    }
}

module.exports = new BotStuff();
