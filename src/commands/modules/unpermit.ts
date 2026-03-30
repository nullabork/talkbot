import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('unpermit')
    .setDescription('Remove a user\'s permission to use the bot')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to unpermit')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (!server.isPermitted(member)) {
        await interaction.reply({ content: server.lang('unpermit.deny'), ephemeral: true });
        return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const targetMember = interaction.guild?.members.cache.get(targetUser.id);
    if (!targetMember) {
        await interaction.reply('User not found.');
        return;
    }

    // Non-masters can only unpermit themselves
    if (targetMember.id !== member.id && !server.isMaster(member)) {
        await interaction.reply({ content: server.lang('unpermit.deny'), ephemeral: true });
        return;
    }

    server.unpermit(targetMember.id);
    await interaction.reply(server.lang('unpermit.okay', { name: targetMember.displayName }));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const Common = require('@helpers/common');
    commands.add(new BotCommand({
        command_name: 'unpermit',
        execute: (msg: any) => {
            const s = msg.server;
            if (!msg.ownerIsPermitted()) { msg.il8nResponse('unpermit.deny'); return; }
            const roles = msg.message.mentions.roles.concat(msg.getNonSnowflakeRoles());
            roles.forEach((r: any) => s.unpermit(r.id));
            if (msg.message.mentions.members.size === 0 && roles.size === 0) {
                s.unpermit(msg.message.member.id);
            }
            msg.message.mentions.members.forEach((m: any) => {
                if (m.id !== msg.message.member.id && !msg.ownerIsMaster()) {
                    msg.il8nResponse('unpermit.deny'); return;
                }
                s.unpermit(m.id);
            });
            const nicks = Common.makeNiceCsv(msg.message.mentions.members.concat(roles), (e: any) => e.displayName || e.name);
            msg.il8nResponse('unpermit.okay', { name: nicks });
        },
        short_help: 'unpermit.shorthelp',
        long_help: 'unpermit.longhelp',
        group: 'control',
        order: 6,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'unpermit' });
}

module.exports = { data, execute, register, unRegister };
