import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('bind')
    .setDescription('Bind the bot to channels, users, or roles')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('show')
            .setDescription('Show current bindings'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('add')
            .setDescription('Add a channel, user, or role binding')
            .addStringOption(opt => opt.setName('id').setDescription('Channel ID, @user, @role, or #channel').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('remove')
            .setDescription('Remove all bindings')
            .addStringOption(opt => opt.setName('confirm').setDescription('Type "none" to confirm').setRequired(true)),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('permit')
            .setDescription('Enable auto-permitting for bound users'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('unpermit')
            .setDescription('Disable auto-permitting for bound users'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('echo')
            .setDescription('Show raw bind data'),
    ) as SlashCommandBuilder;

function getChannelNames(server: any): Record<string, string> | string[] {
    const obj: Record<string, string> = {};
    (server.bind || []).forEach((id: string) => {
        const channel = server.guild.channels.cache.get(id);
        const user = server.guild.members.cache.get(id);
        const role = server.guild.roles.cache.get(id);
        if (user) obj[user.displayName] = id;
        else if (channel && channel.name) obj[channel.name] = id;
        else if (role) obj[role.name] = id;
        else obj[id] = 'Channel Not Found';
    });
    if (!server.bind || !server.bind.length) return [' No Channels Bound!'];
    return obj;
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const CommentBuilder = require('@models/CommentBuilder');
    const botStuff = require('@helpers/bot-stuff');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const sub = interaction.options.getString('action') || interaction.options.getSubcommand();

    if (sub === 'show') {
        const usage = server.lang('bindusage.title');
        await interaction.reply(CommentBuilder.create({
            data: {
                [usage]: getChannelNames(server),
                'Auto permitting': [server.bindPermit ? 'Turned ON' : ' Turned OFF'],
            },
        }));
    } else if (sub === 'add') {
        if (!botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: server.lang('bind.nopermissions'), ephemeral: true }); return;
        }
        const idStr = interaction.options.getString('id');
        if (!idStr) { await interaction.reply({ content: 'An ID is required for add.', ephemeral: true }); return; }
        // Extract snowflake IDs from mention format or raw ID
        const ids = idStr.match(/\d{17,}/g) || [];
        for (const id of ids) {
            if (!server.bind.includes(id)) server.bind.push(id);
        }
        const usage = server.lang('bindusage.title');
        await interaction.reply(CommentBuilder.create({
            data: { [usage]: getChannelNames(server) },
        }));
    } else if (sub === 'remove') {
        if (!botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: server.lang('bind.nopermissions'), ephemeral: true }); return;
        }
        server.bind = [];
        server.bindPermit = false;
        await interaction.reply(server.lang('bind.setdefault'));
    } else if (sub === 'permit') {
        if (!botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: server.lang('bind.nopermissions'), ephemeral: true }); return;
        }
        server.bindPermit = true;
        await interaction.reply(server.lang('bind.permit'));
    } else if (sub === 'unpermit') {
        if (!botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: server.lang('bind.nopermissions'), ephemeral: true }); return;
        }
        server.bindPermit = false;
        await interaction.reply(server.lang('bind.unpermit'));
    } else if (sub === 'echo') {
        await interaction.reply(JSON.stringify(server.bind));
    }
}

// Listeners for TTS pipeline
async function onUserJoinedChannel({ channelState, member, server }: any): Promise<void> {
    if (!member.voice.channelId) return;
    if (!server.bind || !server.bind.length) return;
    if (!server.bind.includes(channelState.channelId) && !server.bind.some((id: string) => member.roles.cache.has(id))) return;
    if (!server.isBound()) {
        server.setMaster(member);
        await server.joinVoiceChannel(member.voice.channel);
    } else if (server.bindPermit) {
        server.permit(member.id);
    }
}

async function onPreValidate({ message, content, server }: any): Promise<void> {
    const { member, channel } = message;
    if (
        !member.voice.channelId ||
        !server.bind ||
        !server.bind.length ||
        (!server.bind.includes(channel.id) &&
            !(server.bind.includes(member.id) || server.bind.some((id: string) => member.roles.cache.has(id))))
    ) {
        return;
    }
    if (!server.isBound()) {
        server.setMaster(member);
        const settings = server.getMemberSettings(member);
        const connection = await server.joinVoiceChannel(member.voice.channel);
        if (!connection) return;
        setTimeout(() => { server.talk(content, settings); }, 600);
    } else if (server.bindPermit && !server.permitted[member.id]) {
        server.permit(member.id);
    }
}

export const listeners = {
    userJoinedChannel: onUserJoinedChannel,
    preValidate: onPreValidate,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const CommentBuilder = require('@models/CommentBuilder');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'bind',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            const sub = msg.args && msg.args[0] ? msg.args[0].toLowerCase() : 'show';
            if (sub === 'show' || sub === 'list') {
                const usage = s.lang('bindusage.title');
                msg.response(CommentBuilder.create({
                    data: {
                        [usage]: getChannelNames(s),
                        'Auto permitting': [s.bindPermit ? 'Turned ON' : ' Turned OFF'],
                    },
                }));
            } else if (sub === 'add') {
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('bind.nopermissions'); return; }
                const ids = msg.content.match(/\d{17,}/g) || [];
                for (const id of ids) {
                    if (!s.bind.includes(id)) s.bind.push(id);
                }
                const usage = s.lang('bindusage.title');
                msg.response(CommentBuilder.create({
                    data: { [usage]: getChannelNames(s) },
                }));
            } else if (sub === 'none' || sub === 'remove') {
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('bind.nopermissions'); return; }
                s.bind = [];
                s.bindPermit = false;
                msg.il8nResponse('bind.setdefault');
            } else if (sub === 'permit') {
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('bind.nopermissions'); return; }
                s.bindPermit = true;
                msg.il8nResponse('bind.permit');
            } else if (sub === 'unpermit') {
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('bind.nopermissions'); return; }
                s.bindPermit = false;
                msg.il8nResponse('bind.unpermit');
            } else if (sub === 'echo') {
                msg.response(JSON.stringify(s.bind));
            } else {
                // treat as adding an ID
                if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('bind.nopermissions'); return; }
                const ids = msg.content.match(/\d{17,}/g) || [];
                for (const id of ids) {
                    if (!s.bind.includes(id)) s.bind.push(id);
                }
                const usage = s.lang('bindusage.title');
                msg.response(CommentBuilder.create({
                    data: { [usage]: getChannelNames(s) },
                }));
            }
        },
        short_help: 'bind.shorthelp',
        long_help: 'bind.longhelp',
        group: 'server',
        listeners: {
            userJoinedChannel: onUserJoinedChannel,
            preValidate: onPreValidate,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'bind' });
}

module.exports = { data, execute, listeners, register, unRegister };
