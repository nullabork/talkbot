import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('evalo')
    .setDescription('Evaluate code (dev only)')
    .addStringOption(option =>
        option.setName('code')
            .setDescription('JavaScript code to evaluate')
            .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const util = require('util');

    const devIds = process.env.DEV_IDS?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const isDev = devIds.indexOf(interaction.user.id) >= 0;
    if (!isDev) {
        await interaction.reply({ content: 'Dev only command.', ephemeral: true });
        return;
    }

    const code = interaction.options.getString('code', true);

    try {
        const client = interaction.client;
        let evaled = eval(code);
        if (typeof evaled !== 'string') evaled = util.inspect(evaled);
        if (evaled.length > 1950) evaled = evaled.substr(0, 1950);
        // Clean backticks and @ mentions
        evaled = evaled
            .replace(/`/g, '`' + String.fromCharCode(8203))
            .replace(/@/g, '@' + String.fromCharCode(8203));
        await interaction.reply({ content: '```xl\n' + evaled + '\n```', ephemeral: true });
    } catch (err) {
        let msg = (err as Error).message;
        if (msg.length > 1900) msg = msg.substr(0, 1900);
        await interaction.reply({ content: '```xl\n' + msg + '\n```', ephemeral: true });
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'evalo',
        execute: (msg: any) => {
            if (!msg.ownerIsDev()) return;
            const util = require('util');
            try {
                let evaled = eval(msg.content);
                if (typeof evaled !== 'string') evaled = util.inspect(evaled);
                if (evaled.length > 1950) evaled = evaled.substr(0, 1950);
                evaled = evaled
                    .replace(/`/g, '`' + String.fromCharCode(8203))
                    .replace(/@/g, '@' + String.fromCharCode(8203));
                msg.response('```xl\n' + evaled + '\n```');
            } catch (err: any) {
                let errMsg = err.message;
                if (errMsg.length > 1900) errMsg = errMsg.substr(0, 1900);
                msg.response('```xl\n' + errMsg + '\n```');
            }
        },
        short_help: 'evalo.shorthelp',
        long_help: 'evalo.longhelp',
        hidden: true,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'evalo' });
}

module.exports = { data, execute, register, unRegister };
