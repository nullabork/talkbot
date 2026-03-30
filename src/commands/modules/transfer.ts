import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer bot master to another user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to transfer control to')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const botStuff = require('@helpers/bot-stuff');
    if (server.connecting) { await interaction.reply(server.lang('transfer.connecting')); return; }
    if (server.leaving) { await interaction.reply(server.lang('transfer.leaving')); return; }

    if (!server.isMaster(member) && !botStuff.canManageTheServer(server, member) && server.isBound()) {
        await interaction.reply({ content: server.lang('transfer.nopermissions'), ephemeral: true });
        return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const newMaster = interaction.guild?.members.cache.get(targetUser.id);
    if (!newMaster) {
        await interaction.reply(server.lang('transfer.membernoexist'));
        return;
    }

    const chanId = server?.connection?.joinConfig?.channelId;
    if (chanId && newMaster?.voice?.channel?.id !== chanId) {
        await interaction.reply(server.lang('transfer.samevoice'));
        return;
    }

    if (!newMaster.voice?.channel?.joinable) {
        await interaction.reply(server.lang('transfer.channelpermissions'));
        return;
    }

    await interaction.deferReply();

    server.setMaster(newMaster);
    if (server.connection) {
        await interaction.editReply(server.lang('transfer.okay', { name: newMaster.displayName }));
    } else {
        await server.joinVoiceChannel(newMaster.voice.channel);
        if (!server.connection) {
            await interaction.editReply(server.lang('transfer.error'));
            server.release();
            return;
        }
        await interaction.editReply(server.lang('transfer.okay', { name: newMaster.displayName }));
        server.addMemberSetting(newMaster, 'toLanguage', 'default');
        if (server.getMemberSetting(newMaster, 'muted')) {
            server.addMemberSetting(newMaster, 'muted', false);
        }
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'transfer',
        execute: async (msg: any) => {
            const s = msg.server;
            if (s.connecting) return msg.il8nResponse('transfer.connecting');
            if (s.leaving) return msg.il8nResponse('transfer.leaving');
            if (!msg.ownerIsMaster() && !msg.ownerCanManageTheServer() && s.isBound()) {
                msg.il8nResponse('transfer.nopermissions'); return;
            }
            if (msg.args.length === 0 || msg.message.mentions.members.size < 1) {
                msg.il8nResponse('transfer.args'); return;
            }
            const newMaster = msg.message.mentions.members.first();
            if (!newMaster) { msg.il8nResponse('transfer.membernoexist'); return; }
            const chanId = s?.connection?.joinConfig?.channelId;
            if (chanId && newMaster?.voice?.channel?.id !== chanId) {
                msg.il8nResponse('transfer.samevoice'); return;
            }
            if (!newMaster.voice.channel.joinable) { msg.il8nResponse('transfer.channelpermissions'); return; }
            s.setMaster(newMaster);
            if (s.connection) {
                msg.il8nResponse('transfer.okay', { name: newMaster.displayName });
            } else {
                await s.joinVoiceChannel(newMaster.voice.channel);
                if (!s.connection) { msg.il8nResponse('transfer.error'); s.release(); return; }
                msg.il8nResponse('transfer.okay', { name: newMaster.displayName });
                s.addMemberSetting(newMaster, 'toLanguage', 'default');
                if (s.getMemberSetting(newMaster, 'muted')) {
                    s.addMemberSetting(newMaster, 'muted', false);
                    msg.il8nResponse('mute.unmuted');
                }
            }
        },
        short_help: 'transfer.shorthelp',
        long_help: 'transfer.longhelp',
        group: 'control',
        order: 3,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'transfer' });
}

module.exports = { data, execute, register, unRegister };
