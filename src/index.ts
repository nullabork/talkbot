/**
 * TalkBot - Discord Text-to-Speech Bot
 * TypeScript entry point replacing bot.js
 */

// Environment validation first
import { env } from './env';
import { Events } from 'discord.js';

const commands = require('@commands');
const figlet = require('figlet');
const botStuff = require('@helpers/bot-stuff');
const Common = require('@helpers/common');
const testing = require('@helpers/runtime-testing');
const world = require('@models/World');
const config = require('./config-loader');

const bot = botStuff.bot;

(async () => {
    // Runtime testing
    await testing.TestIfTTSAPIServicesAreConfigured();

    // Splash screen
    figlet('TalkBot', (_err: any, data: string) => console.log(data));

    // Bot ready
    bot.on(Events.ClientReady, async () => {
        Common.out('Logged in as: ' + bot.user.username + ' - (' + bot.user.id + ')');
        Common.error('LOG CHECKPOINT: THE BOT STARTED. THIS IS NOT AN ERROR MESSAGE');
        world.startup();

        Common.out('Bot ready. Using prefix commands (default: !).');
    });

    // Guild events
    bot.on(Events.GuildCreate, (guild: any) => {
        try { world.addServer(guild); } catch (ex: any) { Common.error(ex); }
    });

    bot.on(Events.GuildDelete, (guild: any) => {
        try { world.removeServer(guild); } catch (ex: any) { Common.error(ex); }
    });

    bot.on(Events.GuildMemberRemove, (member: any) => {
        try {
            const server = world.servers[member.guild.id];
            if (server && server.isMaster(member)) server.release();
        } catch (ex: any) { Common.error(ex); }
    });

    // Voice state
    bot.on(Events.VoiceStateUpdate, (oldState: any, newState: any) => {
        try {
            const server = world.servers[oldState.guild.id];
            if (!server) return;
            server.channelJoined(newState);
            if (!oldState) return;
            if (!server.isMaster(oldState.guild.members.cache.get(oldState.id))) return;
            if (oldState.channelId && (!newState.channelId || !newState.guild.channels.cache.get(newState.channelId)?.joinable)) {
                server.release();
            } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                server.switchVoiceChannel(newState.guild.channels.cache.get(newState.channelId));
            }
        } catch (ex: any) { Common.error(ex); }
    });

    // Message handling — TTS reading + legacy prefix commands
    bot.on(Events.MessageCreate, (message: any) => {
        try {
            if (message.member && message.member.id === bot.user.id) return;
            let server = null;
            if (message.guild) {
                server = world.servers[message.guild.id];
                if (!server) { Common.error("Can't find server for guild id: " + message.guild.id); return; }
            }
            if (commands.isCommand(message, server)) {
                commands.process(message, server, world);
            } else if (message.member) {
                server.speak(message);
            }
        } catch (ex: any) { Common.error(ex); }
    });

    // Error/disconnect handlers
    bot.on(Events.ShardDisconnect, (evt: any, shardID: number) => {
        try {
            world.saveAll();
            world.dispose();
            Common.out(`Shard ${shardID} Disconnected, reconnecting`);
            Common.out(evt);
            botStuff.connect();
        } catch (ex: any) { Common.error(ex); }
    });

    bot.on(Events.Error, Common.error);
    bot.on('guildUnavailable', (guild: any) => Common.error('guild unavailable: ' + guild.id));
    bot.on('rateLimit', (info: any) => { Common.error('rate limited'); Common.error(info); });
    bot.on(Events.ShardResume, (replayed: number, shardID: number) => Common.error(`resume ${shardID}: ` + replayed));
    bot.on(Events.Warn, (info: string) => Common.error('warn:' + info));
    bot.on(Events.ShardReconnecting, (id: number) => Common.error(`Shard with ID ${id} reconnected.`));

    // Process handlers
    process.on('SIGINT', () => world.kill('SIGINT'));
    process.on('uncaughtException', (err: Error) => {
        Common.error(err);
        world.kill('uncaughtException: ' + err.message);
    });

    // Start!
    botStuff.connect();
})();
