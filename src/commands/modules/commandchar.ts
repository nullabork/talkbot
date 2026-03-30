import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('commandchar')
    .setDescription('Set the command prefix character')
    .addStringOption(option =>
        option.setName('char')
            .setDescription('New command character')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const botStuff = require('@helpers/bot-stuff');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const char = interaction.options.getString('char');
    if (!char) {
        await interaction.reply(server.lang('commandchar.okay'));
        return;
    }

    if (!botStuff.canManageTheServer(server, member)) {
        await interaction.reply({ content: server.lang('commandchar.usage'), ephemeral: true });
        return;
    }

    server.command_char = char;
    await interaction.reply(server.lang('commandchar.okay'));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'commandchar',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!msg.args || msg.args.length === 0) {
                msg.il8nResponse('commandchar.okay');
                return;
            }
            if (!botStuff.canManageTheServer(s, m)) {
                msg.il8nResponse('commandchar.usage');
                return;
            }
            s.command_char = msg.args[0];
            msg.il8nResponse('commandchar.okay');
        },
        short_help: 'commandchar.shorthelp',
        long_help: 'commandchar.longhelp',
        group: 'server',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'commandchar' });
}

module.exports = { data, execute, register, unRegister };
