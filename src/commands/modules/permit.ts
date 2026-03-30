import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('permit')
    .setDescription('Permit a user to use the bot')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to permit')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    if (!server.isMaster(member)) {
        await interaction.reply({ content: server.lang('permit.nope'), ephemeral: true });
        return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const targetMember = interaction.guild?.members.cache.get(targetUser.id);
    if (!targetMember) {
        await interaction.reply(server.lang('permit.none'));
        return;
    }

    server.permit(targetMember.id);
    await interaction.reply(server.lang('permit.okay', { name: targetMember.displayName }));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const Common = require('@helpers/common');
    commands.add(new BotCommand({
        command_name: 'permit',
        execute: (msg: any) => {
            const s = msg.server;
            if (!msg.ownerIsMaster()) { msg.il8nResponse('permit.nope'); return; }
            const roles = msg.message.mentions.roles.concat(msg.getNonSnowflakeRoles());
            if (msg.message.mentions.members.size === 0 && roles.size === 0) {
                msg.il8nResponse('permit.none'); return;
            }
            msg.message.mentions.members.forEach((m: any) => s.permit(m.id));
            roles.forEach((r: any) => s.permit(r.id));
            const nicks = Common.makeNiceCsv(msg.message.mentions.members.concat(roles), (e: any) => e.displayName || e.name);
            msg.il8nResponse('permit.okay', { name: nicks });
        },
        short_help: 'permit.shorthelp',
        long_help: 'permit.longhelp',
        group: 'control',
        order: 5,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'permit' });
}

module.exports = { data, execute, register, unRegister };
