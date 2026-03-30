import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('adminrole')
    .setDescription('Set the admin role for bot management')
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('Role to set as admin')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const botStuff = require('@helpers/bot-stuff');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const devIds = process.env.DEV_IDS?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const isDev = devIds.indexOf(member.id) >= 0;
    if (!isDev && !botStuff.canManageTheServer(server, member)) {
        await interaction.reply({ content: server.lang('adminrole.notbotowner'), ephemeral: true });
        return;
    }

    const role = interaction.options.getRole('role', true);
    server.adminrole = role.id;
    await interaction.reply(server.lang('adminrole.okay'));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const botStuff = require('@helpers/bot-stuff');
    commands.add(new BotCommand({
        command_name: 'adminrole',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            const devIds = process.env.DEV_IDS?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
            const isDev = devIds.indexOf(m.id) >= 0;
            if (!isDev && !botStuff.canManageTheServer(s, m)) {
                msg.il8nResponse('adminrole.notbotowner');
                return;
            }
            if (!msg.args || msg.args.length === 0) {
                msg.il8nResponse('adminrole.usage');
                return;
            }
            const roles = msg.message.mentions.roles;
            if (roles && roles.size > 0) {
                s.adminrole = roles.first().id;
            } else {
                s.adminrole = msg.args[0];
            }
            msg.il8nResponse('adminrole.okay');
        },
        short_help: 'adminrole.shorthelp',
        long_help: 'adminrole.longhelp',
        group: 'server',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'adminrole' });
}

module.exports = { data, execute, register, unRegister };
