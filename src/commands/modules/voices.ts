import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('voices')
    .setDescription('Find available voices')
    .addStringOption(option =>
        option.setName('search')
            .setDescription('Search filter for voices')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const search = interaction.options.getString('search') || '';
    const embed = {
        color: 0x0099ff,
        title: `Click to find voices${search ? ' for: ' + search + '.' : '.'}`,
        url: `https://voices.talkbot.dev/?find=${encodeURI(search)}`,
        description: 'talkbot voice and voice sample database.',
        thumbnail: {
            url: 'https://voices.talkbot.dev/img/face_200.png',
        },
    };

    await interaction.reply({ embeds: [embed] });
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'voices',
        command_arg: 'l',
        execute: (msg: any) => {
            const cmds = require('@commands');
            const exampleEmbed = {
                color: 0x0099ff,
                title: `Click to find voices${msg.content ? ' for: ' + msg.content + '.' : '.'}`,
                url: `https://voices.talkbot.dev/?chr=${encodeURI(cmds.getCommandChar(msg.server))}&find=${encodeURI(msg.content)}`,
                description: 'talkbot voice and voice sample database.',
                thumbnail: { url: 'https://voices.talkbot.dev/img/face_200.png' },
            };
            msg.richResponse(exampleEmbed);
        },
        short_help: 'voices.shorthelp',
        long_help: 'voices.longhelp',
        group: 'info',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'voices' });
}

module.exports = { data, execute, register, unRegister };
