import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply('pong');
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'ping',
        execute: (msg: any) => msg.il8nResponse('ping.okay'),
        short_help: 'ping.shorthelp',
        long_help: 'ping.longhelp',
        group: 'info',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'ping' });
}

module.exports = { data, execute, register, unRegister };
