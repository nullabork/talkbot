import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('keep')
    .setDescription('Set how many messages to keep in the channel')
    .addStringOption(option =>
        option.setName('count')
            .setDescription('Number of messages to keep, or "all"')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const botStuff = require('@helpers/bot-stuff');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const countArg = interaction.options.getString('count', true);

    if (!botStuff.canManageTheServer(server, member)) {
        await interaction.reply({ content: server.lang('keep.nope'), ephemeral: true });
        return;
    }

    if (!botStuff.botHasManageMessagePermissions(server)) {
        await interaction.reply(server.lang('keep.msgpermissions'));
        return;
    }

    if (/^(all)/i.test(countArg)) {
        server.addSettings('keepMessages', { count: null });
        await interaction.reply(server.lang('keep.all'));
        return;
    }

    if (/^(\d+)$/i.test(countArg)) {
        server.addSettings('keepMessages', { count: countArg });
        await interaction.reply(server.lang('keep.keepCount', { count: countArg }));
        return;
    }

    await interaction.reply(server.lang('keep.usage'));
}

// Message/messageDelivered listeners for TTS pipeline
function onMessage({ message, server }: any): null {
    const count = server.getSettingObjectValue('keepMessages', 'count');
    if (count == null || !Number.isInteger(+count)) return null;
    const queue = server.getSettingObjectValue('keepMessages', 'keepQueue') || [];
    queue.push(message);
    server.addSettings('keepMessages', { keepQueue: queue });
    return null;
}

function onMessageDelivered({ message, server }: any): null {
    const count = server.getSettingObjectValue('keepMessages', 'count');
    if (!count || !Number.isInteger(+count)) return null;
    const queue = server.getSettingObjectValue('keepMessages', 'keepQueue') || [];
    if (queue.length > +count) {
        const removes = queue.splice(0, queue.length - +count);
        message.channel.bulkDelete(removes);
    }
    server.addSettings('keepMessages', { keepQueue: queue });
    return null;
}

export const listeners = {
    message: onMessage,
    messageDelivered: onMessageDelivered,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'keep',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!botStuff.canManageTheServer(s, m)) { msg.il8nResponse('keep.nope'); return; }
            if (!botStuff.botHasManageMessagePermissions(s)) { msg.il8nResponse('keep.msgpermissions'); return; }
            if (!msg.args || msg.args.length === 0) { msg.il8nResponse('keep.usage'); return; }
            const countArg = msg.args[0];
            if (/^(all)/i.test(countArg)) {
                s.addSettings('keepMessages', { count: null });
                msg.il8nResponse('keep.all');
                return;
            }
            if (/^(\d+)$/i.test(countArg)) {
                s.addSettings('keepMessages', { count: countArg });
                msg.il8nResponse('keep.keepCount', { count: countArg });
                return;
            }
            msg.il8nResponse('keep.usage');
        },
        short_help: 'keep.shorthelp',
        long_help: 'keep.longhelp',
        group: 'server',
        listeners: {
            message: onMessage,
            messageDelivered: onMessageDelivered,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'keep' });
}

module.exports = { data, execute, listeners, register, unRegister };
