import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('sidle')
    .setDescription('Transfer bot master to yourself (admin only)');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const botStuff = require('@helpers/bot-stuff');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (server.connecting) { await interaction.reply(server.lang('sidle.connecting')); return; }
    if (server.leaving) { await interaction.reply(server.lang('sidle.leaving')); return; }

    if (!server.isBound()) {
        await interaction.reply(server.lang('sidle.none'));
        return;
    }

    if (!botStuff.canManageTheServer(server, member) && !botStuff.canManageTheBot(server, member)) {
        await interaction.reply({ content: server.lang('sidle.nope'), ephemeral: true });
        return;
    }

    if (
        !member.voice ||
        !server.connection ||
        member.voice.channel?.id !== server.connection.joinConfig.channelId
    ) {
        await interaction.reply(server.lang('sidle.novoice'));
        return;
    }

    server.setMaster(member);
    server.addMemberSetting(member, 'toLanguage', 'default');
    await interaction.reply(server.lang('sidle.okay'));

    if (server.getMemberSetting(member, 'muted')) {
        server.addMemberSetting(member, 'muted', false);
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'sidle',
        execute: (msg: any) => {
            const s = msg.server;
            if (s.connecting) return msg.il8nResponse('sidle.connecting');
            if (s.leaving) return msg.il8nResponse('sidle.leaving');
            if (!s.isBound()) { msg.il8nResponse('sidle.none'); return; }
            if (!msg.ownerCanManageTheServer() && !msg.memberCanManageTheBot()) { msg.il8nResponse('sidle.nope'); return; }
            const newMaster = msg.message.member;
            if (!newMaster) { msg.il8nResponse('sidle.membernoexist'); return; }
            if (!newMaster.voice || !s.connection || newMaster.voice.channel.id !== s.connection.joinConfig.channelId) {
                msg.il8nResponse('sidle.novoice'); return;
            }
            s.setMaster(newMaster);
            s.addMemberSetting(newMaster, 'toLanguage', 'default');
            msg.il8nResponse('sidle.okay');
            if (s.getMemberSetting(newMaster, 'muted')) {
                s.addMemberSetting(newMaster, 'muted', false);
                msg.il8nResponse('mute.unmuted');
            }
        },
        short_help: 'sidle.shorthelp',
        long_help: 'sidle.longhelp',
        group: 'control',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'sidle' });
}

module.exports = { data, execute, register, unRegister };
