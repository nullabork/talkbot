export {};

import type { Message, GuildMember, Collection, Role } from 'discord.js';

const botStuff = require('@helpers/bot-stuff');
const Common = require('@helpers/common');

class MessageDetails {
    world: any;
    server: any;
    args: string[] | null;
    message: any;
    content: string;

    constructor(client_data?: Partial<MessageDetails>) {
        this.world = null;
        this.server = null;
        this.args = null;
        this.message = null;
        this.content = '';

        if (client_data) {
            Object.assign(this, client_data);
        }
    }

    response(message: string, params?: unknown): void {
        const chan = this.message.channel;
        if (message.length > 2000) {
            Common.error(new Error('message too long for discord'));
            message = message.substring(0, 2000);
        }
        chan.send(message);
    }

    richResponse(embobj: object): void {
        const chan = this.message.channel;
        chan.send({ embed: embobj }).then(chan.stopTyping());
    }

    getNonSnowflakeRoles(): any {
        if (!this.args) {
            return [];
        }

        this.args.map((e: string) => e.toLowerCase());

        const roles = this.server.guild.roles.cache;
        return roles.filter((item: any) => {
            return item.name && this.args!.indexOf(item.name.toLowerCase()) > -1;
        });
    }

    ownerIsMaster(): boolean {
        return this.server.isMaster(this.message.member);
    }

    ownerIsDev(): boolean {
        const devIds = process.env.DEV_IDS?.split(',').map(s => s.trim()).filter(Boolean) || [];
        if (!devIds.length) {
            return false;
        }
        return devIds.indexOf(this.message.member.id) >= 0;
    }

    ownerIsPermitted(): boolean {
        return this.server.isPermitted(this.message.member);
    }

    ownerCanManageTheServer(): boolean {
        const rtn = botStuff.canManageTheServer(this.server, this.message.member);
        return rtn;
    }

    memberCanManageTheBot(): boolean {
        const rtn = botStuff.canManageTheBot(this.server, this.message.member);
        return rtn;
    }

    il8nResponse(key: string, params?: Record<string, unknown>): void {
        const server = this.server;
        if (!params) params = {};
        params.title = params.title || server.getMemberSetting(this.message.member, 'mytitle');
        const message = server.lang(key, params);

        return this.response(message);
    }

    getDisplayNamesAsCSV(): string {
        let names = '';
        this.message.mentions.members.forEach((member: any) => {
            names += member.displayName + ', ';
        });
        names = names.substring(0, names.length - 2);

        return names;
    }
}

module.exports = MessageDetails;
