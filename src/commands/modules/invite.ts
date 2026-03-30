import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the invite link for the bot');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const botStuff = require('@helpers/bot-stuff');
    const embed = {
        color: 0x0099ff,
        title: 'Click to invite the bot to your server',
        url: `https://discord.com/oauth2/authorize?&client_id=${botStuff.bot.user.id}&scope=bot&permissions=0`,
        description: 'Add talkbot to your server',
        thumbnail: {
            url: 'https://voices.talkbot.dev/img/face_200.png',
        },
    };

    await interaction.reply({ embeds: [embed] });
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'invite',
        command_arg: 'i',
        execute: (msg: any) => {
            const exampleEmbed = {
                color: 0x0099ff,
                title: 'Click to invite the bot to your server',
                url: `https://discord.com/oauth2/authorize?&client_id=${botStuff.bot.user.id}&scope=bot&permissions=0`,
                description: 'Add talkbot to your server',
                thumbnail: { url: 'https://voices.talkbot.dev/img/face_200.png' },
            };
            msg.richResponse(exampleEmbed);
        },
        short_help: 'invite.shorthelp',
        long_help: 'invite.longhelp',
        group: 'info',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'invite' });
}

module.exports = { data, execute, register, unRegister };
