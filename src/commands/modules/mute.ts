import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute yourself or another user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to mute (leave empty to mute yourself)')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const targetUser = interaction.options.getUser('user');
    if (targetUser) {
        // Muting someone else requires master or server manage perms
        const botStuff = require('@helpers/bot-stuff');
        if (!server.isMaster(member) && !botStuff.canManageTheServer(server, member)) {
            await interaction.reply({ content: 'You do not have permission to mute others.', ephemeral: true });
            return;
        }
        const target = interaction.guild?.members.cache.get(targetUser.id);
        if (!target) { await interaction.reply('User not found.'); return; }
        server.addMemberSetting(target, 'muted', true);
        await interaction.reply(server.lang('mute.okay', { name: target.displayName }));
    } else {
        server.addMemberSetting(member, 'muted', true);
        await interaction.reply(server.lang('mute.okay', { name: 'you' }));
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'mute',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (msg.message.mentions.members && msg.message.mentions.members.size > 0) {
                if (!s.isMaster(m) && !botStuff.canManageTheServer(s, m)) {
                    msg.il8nResponse('mute.nope');
                    return;
                }
                msg.message.mentions.members.forEach((target: any) => {
                    s.addMemberSetting(target, 'muted', true);
                    msg.il8nResponse('mute.okay', { name: target.displayName });
                });
            } else {
                s.addMemberSetting(m, 'muted', true);
                msg.il8nResponse('mute.okay', { name: 'you' });
            }
        },
        short_help: 'mute.shorthelp',
        long_help: 'mute.longhelp',
        group: 'control',
        order: 7,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'mute' });
}

module.exports = { data, execute, register, unRegister };
