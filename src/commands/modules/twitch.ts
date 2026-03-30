import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('twitch')
    .setDescription('Manage Twitch chat integration')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('permit')
            .setDescription('Permit a Twitch user/group to speak')
            .addStringOption(opt => opt.setName('channel').setDescription('Twitch channel name').setRequired(true))
            .addStringOption(opt => opt.setName('who').setDescription('User, "mods", "subs", or "all"').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('unpermit')
            .setDescription('Unpermit a Twitch user/group')
            .addStringOption(opt => opt.setName('channel').setDescription('Twitch channel name').setRequired(true))
            .addStringOption(opt => opt.setName('who').setDescription('User, "mods", "subs", or "all"').setRequired(true)),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const config = require('../../config-loader');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (!server.twitch) server.twitch = {};
    if (!server.isBound()) { await interaction.reply(server.lang('twitch.notbound')); return; }
    if (!server.isMaster(member)) { await interaction.reply({ content: server.lang('twitch.notmaster'), ephemeral: true }); return; }

    const sub = interaction.options.getString('action') || interaction.options.getSubcommand();
    const twitchChannel = interaction.options.getString('channel', true);
    const who = interaction.options.getString('who', true);

    if (sub === 'permit') {
        // Link the twitch channel if not already linked
        if (!server.twitch[twitchChannel] || !server.twitch[twitchChannel].link) {
            try {
                const Chat = require('tmi.js');
                const Common = require('@helpers/common');
                const TextToSpeechService = require('@services/TextToSpeechService');
                const config = require('../../config-loader');
                const chatChannel = new Chat.client({
                    channels: [twitchChannel],
                    reconnect: true,
                    secure: true,
                });
                chatChannel.connect();
                server.twitch[twitchChannel] = { link: chatChannel, permitted: {} };
            } catch (_e) {
                // tmi.js may not be available
            }
        }
        if (!server.twitch[twitchChannel]) server.twitch[twitchChannel] = { permitted: {} };
        if (who === 'mods') server.twitch[twitchChannel].permitted._mods = true;
        else if (who === 'subs') server.twitch[twitchChannel].permitted._subs = true;
        else if (who === 'all') server.twitch[twitchChannel].permitted._all = true;
        else server.twitch[twitchChannel].permitted[who.toLowerCase()] = true;
        await interaction.reply(server.lang('twitch.permitokay', { who, twitch_channel: twitchChannel }));
    } else if (sub === 'unpermit') {
        if (!server.twitch[twitchChannel] || !server.twitch[twitchChannel].permitted) {
            await interaction.reply('No permissions set for that channel.');
            return;
        }
        if (who === 'mods') server.twitch[twitchChannel].permitted._mods = false;
        else if (who === 'subs') server.twitch[twitchChannel].permitted._subs = false;
        else if (who === 'all') server.twitch[twitchChannel].permitted = {};
        else server.twitch[twitchChannel].permitted[who.toLowerCase()] = false;
        await interaction.reply(server.lang('twitch.unpermitokay', { who, twitch_channel: twitchChannel }));
    }
}

// Unfollow listener for TTS pipeline
function onUnfollow({ server, command }: any): void {
    for (const key in server.twitch) {
        command.closeTwitchChatLink(server, key);
    }
}

export const listeners = {
    unfollow: onUnfollow,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'twitch',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!s.twitch) s.twitch = {};
            if (!s.isBound()) { msg.il8nResponse('twitch.notbound'); return; }
            if (!s.isMaster(m)) { msg.il8nResponse('twitch.notmaster'); return; }
            if (!msg.args || msg.args.length < 2) { msg.il8nResponse('twitch.usage'); return; }
            const sub = msg.args[0].toLowerCase();
            const twitchChannel = msg.args[1];
            const who = msg.args[2] || 'all';
            if (sub === 'permit') {
                if (!s.twitch[twitchChannel] || !s.twitch[twitchChannel].link) {
                    try {
                        const Chat = require('tmi.js');
                        const chatChannel = new Chat.client({
                            channels: [twitchChannel],
                            reconnect: true,
                            secure: true,
                        });
                        chatChannel.connect();
                        s.twitch[twitchChannel] = { link: chatChannel, permitted: {} };
                    } catch (_e) {
                        // tmi.js may not be available
                    }
                }
                if (!s.twitch[twitchChannel]) s.twitch[twitchChannel] = { permitted: {} };
                if (who === 'mods') s.twitch[twitchChannel].permitted._mods = true;
                else if (who === 'subs') s.twitch[twitchChannel].permitted._subs = true;
                else if (who === 'all') s.twitch[twitchChannel].permitted._all = true;
                else s.twitch[twitchChannel].permitted[who.toLowerCase()] = true;
                msg.il8nResponse('twitch.permitokay', { who, twitch_channel: twitchChannel });
            } else if (sub === 'unpermit') {
                if (!s.twitch[twitchChannel] || !s.twitch[twitchChannel].permitted) {
                    msg.response('No permissions set for that channel.');
                    return;
                }
                if (who === 'mods') s.twitch[twitchChannel].permitted._mods = false;
                else if (who === 'subs') s.twitch[twitchChannel].permitted._subs = false;
                else if (who === 'all') s.twitch[twitchChannel].permitted = {};
                else s.twitch[twitchChannel].permitted[who.toLowerCase()] = false;
                msg.il8nResponse('twitch.unpermitokay', { who, twitch_channel: twitchChannel });
            } else {
                msg.il8nResponse('twitch.usage');
            }
        },
        short_help: 'twitch.shorthelp',
        long_help: 'twitch.longhelp',
        group: 'server',
        listeners: {
            unfollow: onUnfollow,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'twitch' });
}

module.exports = { data, execute, listeners, register, unRegister };
