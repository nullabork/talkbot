import type { Guild } from 'discord.js';

const botStuff = require('@helpers/bot-stuff');
const Server = require('@models/Server');
const Common = require('@helpers/common');
import { env } from '../env';
const bot = botStuff.bot;

class World {
    servers: Record<string, any>;
    presence_timeout: ReturnType<typeof setTimeout> | null;
    default_title: string;

    constructor() {
        this.servers = {};
        this.presence_timeout = null;
        this.default_title = env.DEFAULT_TITLE;
    }

    startup(): void {
        const world = this;
        bot.guilds.cache.forEach((guild: Guild) => world.addServer(guild));
        world.setPresence();
        world.startRebootTimer();
    }

    addServer(guild: Guild): void {
        this.servers[guild.id] = new Server(guild, this);
        this.setPresence();
        Common.out(guild.id + ': added to the world');
    }

    removeServer(guild: Guild): void {
        if (!this.servers[guild.id]) return;
        const server = this.servers[guild.id];
        delete this.servers[guild.id];
        this.setPresence();
        server.save();
        server.dispose();
        Common.out(guild.id + ': removed from the world');
    }

    setPresence(): void {
        const w = this;
        const presence_timer = function () {
            w.presence_timeout = null;

            bot.user.setPresence({
                status: 'online',
                activity: {
                    name: w.renderPresenceHelp(),
                    type: 1,
                    url: 'https://github.com/nullabork/talkbot',
                },
            });
        };

        if (this.presence_timeout) clearTimeout(this.presence_timeout);
        this.presence_timeout = setTimeout(presence_timer, 50);
    }

    renderPresenceHelp(): string {
        const cmds = require('@commands');
        const n = (this.getTotalCharacterCount() / 1000).toFixed(1);
        return cmds.command_char + `help, ${Number.isNaN(Number(n)) ? 0 : n}k chars`;
    }

    getTotalCharacterCount(): number {
        let c = 0;
        for (const server in this.servers)
            if (
                this.servers[server].stats &&
                !isNaN(this.servers[server].stats.characterCount) &&
                typeof this.servers[server].stats.characterCount == 'number'
            )
                c += this.servers[server].stats.characterCount;
        return c;
    }

    saveAll(): void {
        for (const server_id in this.servers) {
            this.servers[server_id].save();
        }
    }

    releaseAll(): void {
        for (const server_id in this.servers) {
            this.servers[server_id].release();
        }
    }

    kill(reason?: string): void {
        if (reason) Common.out('kill(): ' + reason);
        this.releaseAll();
        this.saveAll();
        bot.destroy();
        process.exit();
    }

    getActiveServersCount(): number {
        const w = this;
        let c = 0;
        for (const s in w.servers) {
            if (w.servers[s].isBound()) c++;
        }
        return c;
    }

    startRebootTimer(): void {
        const world = this;

        const reboot_timer = function () {
            if (world.getActiveServersCount() == 0) {
                world.kill('Inactivity reboot');
                return;
            }

            setTimeout(reboot_timer, 60 * 60 * 1000);
        };

        setTimeout(reboot_timer, 12 * 60 * 60 * 1000);
    }

    dispose(): void {
        for (const s in this.servers) {
            this.servers[s].dispose();
        }
    }
}

module.exports = new World();
