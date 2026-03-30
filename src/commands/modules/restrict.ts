import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('restrict')
    .setDescription('Restrict bot to specific text channels')
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to restrict to')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const botStuff = require('@helpers/bot-stuff');
    const CommentBuilder = require('@models/CommentBuilder');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
        // Show current restrictions
        let csv = '';
        if (!server.restrictions || server.restrictions.length === 0) {
            csv = 'none';
        } else {
            for (const index in server.restrictions) {
                const chan = server.guild.channels.cache.find((x: any) => x.id === server.restrictions[index]);
                if (chan) csv += ', #' + chan.name;
            }
            csv = csv.substring(2);
        }

        const usage = server.lang('restrictusage.title');
        await interaction.reply(CommentBuilder.create({
            data: {
                [usage]: [server.lang('restrictusage.description', { restrictions: csv })],
            },
        }));
        return;
    }

    if (!botStuff.canManageTheServer(server, member)) {
        await interaction.reply({ content: server.lang('restrict.nopermissions'), ephemeral: true });
        return;
    }

    if (!server.restrictions.includes(channel.id)) {
        server.restrictions.push(channel.id);
    }
    await interaction.reply(server.lang('restrict.okay', { channels: channel.name }));
}

// Validate listener for TTS pipeline
function onValidate({ message, server }: any): boolean {
    if (server.restrictions.length > 0 && !server.restrictions.includes(message.channel.id)) {
        return false;
    }
    return true;
}

export const listeners = {
    validate: onValidate,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const CommentBuilder = require('@models/CommentBuilder');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'restrict',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!msg.args || msg.args.length === 0) {
                let csv = '';
                if (!s.restrictions || s.restrictions.length === 0) {
                    csv = 'none';
                } else {
                    for (const index in s.restrictions) {
                        const chan = s.guild.channels.cache.find((x: any) => x.id === s.restrictions[index]);
                        if (chan) csv += ', #' + chan.name;
                    }
                    csv = csv.substring(2);
                }
                const usage = s.lang('restrictusage.title');
                msg.response(CommentBuilder.create({
                    data: {
                        [usage]: [s.lang('restrictusage.description', { restrictions: csv })],
                    },
                }));
                return;
            }
            if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('restrict.nopermissions'); return; }
            if (msg.args[0].toLowerCase() === 'none') {
                s.restrictions = [];
                msg.il8nResponse('restrict.setdefault');
                return;
            }
            const ids = msg.content.match(/\d{17,}/g) || [];
            const channelNames: string[] = [];
            for (const id of ids) {
                if (!s.restrictions.includes(id)) s.restrictions.push(id);
                const chan = s.guild.channels.cache.get(id);
                if (chan) channelNames.push(chan.name);
            }
            // Also support channel name from current channel
            if (ids.length === 0) {
                const chanId = msg.message.channel.id;
                if (!s.restrictions.includes(chanId)) s.restrictions.push(chanId);
                channelNames.push(msg.message.channel.name);
            }
            msg.il8nResponse('restrict.okay', { channels: channelNames.join(', ') });
        },
        short_help: 'restrict.shorthelp',
        long_help: 'restrict.longhelp',
        group: 'server',
        listeners: {
            validate: onValidate,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'restrict' });
}

module.exports = { data, execute, listeners, register, unRegister };
