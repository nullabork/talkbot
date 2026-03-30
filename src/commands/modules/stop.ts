import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the bot from speaking')
    .addBooleanOption(option =>
        option.setName('all')
            .setDescription('Stop all queued messages too')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (!server.inChannel()) { await interaction.reply({ content: 'Bot is not in a voice channel.', ephemeral: true }); return; }

    const botStuff = require('@helpers/bot-stuff');
    if (!server.isPermitted(member) && !botStuff.canManageTheServer(server, member)) {
        await interaction.reply({ content: server.lang('stop.nope'), ephemeral: true });
        return;
    }

    const all = interaction.options.getBoolean('all');
    if (all) {
        server.stop('stop all requested by stop command', true);
        await interaction.reply(server.lang('stop.okayAll'));
    } else {
        server.stop('stop requested by stop command');
        await interaction.reply(server.lang('stop.okay'));
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'stop',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!s.inChannel()) return;
            if (!s.isPermitted(m) && !botStuff.canManageTheServer(s, m)) {
                msg.il8nResponse('stop.nope');
                return;
            }
            const all = msg.args && msg.args[0] === 'all';
            if (all) {
                s.stop('stop all requested by stop command', true);
                msg.il8nResponse('stop.okayAll');
            } else {
                s.stop('stop requested by stop command');
                msg.il8nResponse('stop.okay');
            }
        },
        short_help: 'stop.shorthelp',
        long_help: 'stop.longhelp',
        group: 'control',
        order: 10,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'stop' });
}

module.exports = { data, execute, register, unRegister };
