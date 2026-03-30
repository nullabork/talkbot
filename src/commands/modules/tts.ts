import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('tts')
    .setDescription('Force the bot to speak a message')
    .addStringOption(option =>
        option.setName('message')
            .setDescription('The message to speak')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (!server.isBound()) { await interaction.reply(server.lang('tts.notinchannel')); return; }
    if (!server.inChannel()) { await interaction.reply(server.lang('tts.notinchannel')); return; }
    if (!server.isPermitted(member)) { await interaction.reply({ content: server.lang('tts.notpermitted'), ephemeral: true }); return; }

    const message = interaction.options.getString('message', true);
    // Create a fake message object for the speak pipeline
    server.talk(message, server.getMemberSettings(member));
    await interaction.reply({ content: 'Speaking...', ephemeral: true });
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'tts',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!s.isBound()) { msg.il8nResponse('tts.notinchannel'); return; }
            if (!s.inChannel()) { msg.il8nResponse('tts.notinchannel'); return; }
            if (!s.isPermitted(m)) { msg.il8nResponse('tts.notpermitted'); return; }
            if (!msg.content || msg.content.trim().length === 0) { msg.il8nResponse('tts.usage'); return; }
            s.talk(msg.content, s.getMemberSettings(m));
        },
        short_help: 'tts.shorthelp',
        long_help: 'tts.longhelp',
        group: 'control',
        order: 9,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'tts' });
}

module.exports = { data, execute, register, unRegister };
