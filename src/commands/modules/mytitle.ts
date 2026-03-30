import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mytitle')
    .setDescription('Set your announcement title')
    .addStringOption(option =>
        option.setName('title')
            .setDescription('Your title text')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const title = interaction.options.getString('title');
    if (!title) {
        await interaction.reply(server.lang('mytitle.read'));
        return;
    }

    server.addMemberSetting(member, 'mytitle', title);
    await interaction.reply(server.lang('mytitle.set'));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'mytitle',
        command_arg: 'p',
        execute: (msg: any) => {
            if (!msg.args.length) { msg.il8nResponse('mytitle.read'); return; }
            msg.server.addMemberSetting(msg.message.member, 'mytitle', msg.content);
            msg.il8nResponse('mytitle.set');
        },
        short_help: 'mytitle.shorthelp',
        long_help: 'mytitle.longhelp',
        group: 'personalization',
        hidden: true,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'mytitle' });
}

module.exports = { data, execute, register, unRegister };
