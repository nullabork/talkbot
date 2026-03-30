import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show server TTS statistics')
    .addBooleanOption(option =>
        option.setName('daily')
            .setDescription('Sort by daily stats')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const CommentBuilder = require('@models/CommentBuilder');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const devIds = process.env.DEV_IDS?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const isDev = devIds.indexOf(member.id) >= 0;
    const daily = interaction.options.getBoolean('daily');

    // Init stats
    if (!server.stats) server.stats = {};
    if (!server.dailyStats) server.dailyStats = [];
    if (!server.stats.characterCount) server.stats.characterCount = 0;
    if (!server.stats.wordCount) server.stats.wordCount = 0;
    if (!server.stats.uniqueUsers) server.stats.uniqueUsers = {};

    const getServerStats = (s: any) => {
        const dailyCounts: number[] = [];
        if (s.dailyStats && s.dailyStats.length) {
            for (let i = 0; i < Math.min(s.dailyStats.length, 5); i++) {
                dailyCounts.push(s.dailyStats[s.dailyStats.length - i - 1].characterCount);
            }
        }
        return {
            uniqueUsers: Object.keys(s.stats.uniqueUsers).length,
            characterCount: s.stats.characterCount,
            dailyCharacterCounts: dailyCounts.join(', '),
        };
    };

    let stats;
    if (!isDev) {
        stats = [getServerStats(server)];
    } else {
        const serverList = Object.values(world.servers) as any[];
        let sorted = daily
            ? serverList.sort((a: any, b: any) => {
                const bds = b.dailyStats?.length ? b.dailyStats[b.dailyStats.length - 1].characterCount : 0;
                const ads = a.dailyStats?.length ? a.dailyStats[a.dailyStats.length - 1].characterCount : 0;
                return bds - ads;
            })
            : serverList.sort((a: any, b: any) => (b.stats?.characterCount || 0) - (a.stats?.characterCount || 0));
        sorted = sorted.slice(0, 6);
        stats = sorted.map((s: any) => ({
            _heading: s.server_name,
            _data: getServerStats(s),
        }));
    }

    const help = new CommentBuilder({ data: { stats }, formatKey: true });
    await interaction.reply(help.out());
}

// Message listener for TTS pipeline
function onMessage({ message, server }: any): null {
    if (!server.stats) server.stats = {};
    if (!server.dailyStats) server.dailyStats = [];

    const date = new Date();
    const key = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    let latest = server.dailyStats.length && server.dailyStats[server.dailyStats.length - 1];
    if (!latest || latest.key !== key) {
        latest = { key };
        server.dailyStats.push(latest);
    }
    if (!latest.characterCount) latest.characterCount = 0;
    if (!latest.wordCount) latest.wordCount = 0;
    if (!latest.uniqueUsers) latest.uniqueUsers = {};
    if (!server.stats.characterCount) server.stats.characterCount = 0;
    if (!server.stats.wordCount) server.stats.wordCount = 0;
    if (!server.stats.uniqueUsers) server.stats.uniqueUsers = {};

    const charCount = message.cleanContent.replace(/\s/g, '').length;
    const wordCount = message.cleanContent.split(/\s/).length;
    server.stats.characterCount += charCount;
    server.stats.wordCount += wordCount;
    server.stats.uniqueUsers[message.member.id] = true;
    latest.characterCount += charCount;
    latest.wordCount += wordCount;
    latest.uniqueUsers[message.member.id] = true;
    return null;
}

export const listeners = {
    message: onMessage,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const CommentBuilder = require('@models/CommentBuilder');
    commands.add(new BotCommand({
        command_name: 'stats',
        execute: (msg: any) => {
            const s = msg.server;
            const world = require('@models/World');
            const isDev = msg.ownerIsDev();
            const daily = msg.args && msg.args[0] === 'daily';
            if (!s.stats) s.stats = {};
            if (!s.dailyStats) s.dailyStats = [];
            if (!s.stats.characterCount) s.stats.characterCount = 0;
            if (!s.stats.wordCount) s.stats.wordCount = 0;
            if (!s.stats.uniqueUsers) s.stats.uniqueUsers = {};
            const getServerStats = (sv: any) => {
                const dailyCounts: number[] = [];
                if (sv.dailyStats && sv.dailyStats.length) {
                    for (let i = 0; i < Math.min(sv.dailyStats.length, 5); i++) {
                        dailyCounts.push(sv.dailyStats[sv.dailyStats.length - i - 1].characterCount);
                    }
                }
                return {
                    uniqueUsers: Object.keys(sv.stats.uniqueUsers).length,
                    characterCount: sv.stats.characterCount,
                    dailyCharacterCounts: dailyCounts.join(', '),
                };
            };
            let stats;
            if (!isDev) {
                stats = [getServerStats(s)];
            } else {
                const serverList = Object.values(world.servers) as any[];
                let sorted = daily
                    ? serverList.sort((a: any, b: any) => {
                        const bds = b.dailyStats?.length ? b.dailyStats[b.dailyStats.length - 1].characterCount : 0;
                        const ads = a.dailyStats?.length ? a.dailyStats[a.dailyStats.length - 1].characterCount : 0;
                        return bds - ads;
                    })
                    : serverList.sort((a: any, b: any) => (b.stats?.characterCount || 0) - (a.stats?.characterCount || 0));
                sorted = sorted.slice(0, 6);
                stats = sorted.map((sv: any) => ({
                    _heading: sv.server_name,
                    _data: getServerStats(sv),
                }));
            }
            const help = new CommentBuilder({ data: { stats }, formatKey: true });
            msg.response(help.out());
        },
        short_help: 'stats.shorthelp',
        long_help: 'stats.longhelp',
        group: 'info',
        listeners: {
            message: onMessage,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'stats' });
}

module.exports = { data, execute, listeners, register, unRegister };
