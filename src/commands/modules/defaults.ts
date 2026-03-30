import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('defaults')
    .setDescription('Clear all your personal voice settings');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    server.clearMemberSettings(member);
    await interaction.reply(server.lang('defaults.okay'));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'defaults',
        command_arg: 'd',
        execute: (msg: any) => {
            const s = msg.server;
            s.clearMemberSettings(msg.message.member);
            msg.il8nResponse('defaults.okay');
        },
        short_help: 'defaults.shorthelp',
        long_help: 'defaults.longhelp',
        group: 'personalization',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'defaults' });
}

module.exports = { data, execute, register, unRegister };
