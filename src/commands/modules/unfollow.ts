import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('unfollow')
    .setDescription('Make the bot leave the voice channel');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (server.connecting) { await interaction.reply(server.lang('unfollow.connecting')); return; }
    if (server.leaving) { await interaction.reply(server.lang('unfollow.leaving')); return; }

    if (!server.isBound()) {
        await interaction.reply(server.lang('unfollow.none'));
        return;
    }

    if (!server.isMaster(member)) {
        await interaction.reply(server.lang('unfollow.nope'));
        return;
    }

    const commands = require('@commands');
    commands.notify('unfollow', { member, server });
    server.release();
    await interaction.reply(server.lang('unfollow.okay'));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'unfollow',
        execute: (msg: any) => {
            const s = msg.server;
            if (s.connecting) return msg.il8nResponse('unfollow.connecting');
            if (s.leaving) return msg.il8nResponse('unfollow.leaving');
            if (!s.isBound()) { msg.il8nResponse('unfollow.none'); return; }
            if (!msg.ownerIsMaster()) { msg.il8nResponse('unfollow.nope'); return; }
            s.release(() => {
                commands.notify('unfollow', { member: msg.message.member, server: s });
                msg.il8nResponse('unfollow.okay');
            });
        },
        short_help: 'unfollow.shorthelp',
        long_help: 'unfollow.longhelp',
        group: 'control',
        order: 2,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'unfollow' });
}

module.exports = { data, execute, register, unRegister };
