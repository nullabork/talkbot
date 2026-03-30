import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('follow')
    .setDescription('Make the bot join your voice channel');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const Common = require('@helpers/common');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (server.connecting) { await interaction.reply(server.lang('follow.connecting')); return; }
    if (server.leaving) { await interaction.reply(server.lang('follow.leaving')); return; }

    if (server.isBound()) {
        if (!server.isMaster(member)) {
            await interaction.reply(server.lang('follow.nope', { name: server.bound_to.displayName }));
        } else {
            await interaction.reply(server.lang('follow.huh'));
        }
        return;
    }

    if (!member.voice || !member.voice.channel) {
        await interaction.reply(server.lang('follow.join'));
        return;
    }

    if (!member.voice.channel.joinable) {
        await interaction.reply(server.lang('follow.permissions'));
        return;
    }

    await interaction.deferReply();

    server.setMaster(member);
    await server.joinVoiceChannel(member.voice.channel);

    if (!server.connection) {
        await interaction.editReply(server.lang('follow.error'));
        server.release();
        return;
    }

    server.addMemberSetting(member, 'toLanguage', 'default');
    const commands = require('@commands');
    commands.notify('follow', { member, server });
    await interaction.editReply(server.lang('follow.okay'));

    if (server.getMemberSetting(member, 'muted')) {
        server.addMemberSetting(member, 'muted', false);
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'follow',
        execute: async (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (s.connecting) return msg.il8nResponse('follow.connecting');
            if (s.leaving) return msg.il8nResponse('follow.leaving');
            if (s.isBound()) {
                if (!s.isMaster(m)) msg.il8nResponse('follow.nope', { name: s.bound_to.displayName });
                else msg.il8nResponse('follow.huh');
                return;
            }
            if (m.voice && m.voice.channel) {
                if (!m.voice.channel.joinable) return msg.il8nResponse('follow.permissions');
                s.setMaster(m);
                await s.joinVoiceChannel(m.voice.channel);
                if (!s.connection) { msg.il8nResponse('follow.error'); s.release(); return; }
                s.addMemberSetting(m, 'toLanguage', 'default');
                commands.notify('follow', { member: m, server: s });
                msg.il8nResponse('follow.okay');
                if (s.getMemberSetting(m, 'muted')) {
                    s.addMemberSetting(m, 'muted', false);
                    msg.il8nResponse('mute.unmuted');
                }
            } else {
                msg.il8nResponse('follow.join');
            }
        },
        short_help: 'follow.shorthelp',
        long_help: 'follow.longhelp',
        group: 'control',
        order: 0,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'follow' });
}

module.exports = { data, execute, register, unRegister };
