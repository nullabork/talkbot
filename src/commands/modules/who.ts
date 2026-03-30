import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('who')
    .setDescription('Show who is the current master and permitted users');

function buildPermittedString(server: any): string {
    let members = '';
    for (const id in server.permitted) {
        const member = server.guild.members.cache.find((x: any) => x.id === id);
        if (server.permitted[id]) {
            if (id !== server.bound_to.id) {
                if (member) members += ', (permitted)' + member.displayName;
                else {
                    const role = server.guild.roles.cache.find((x: any) => x.id === id);
                    if (role) members += ', (permitted role)' + role.name;
                    else members += ', ' + id;
                }
            }
        } else {
            if (member) members += ', (unpermitted)' + member.displayName;
        }
    }
    if (members.length < 2) return 'no one else';
    return members.trim().substring(2);
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    if (!server.bound_to) {
        await interaction.reply(server.lang('who.none'));
    } else {
        const masterNick = server.bound_to.displayName;
        await interaction.reply(server.lang('who.okay', {
            mymaster: masterNick,
            permitted: buildPermittedString(server),
        }));
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'who',
        execute: (msg: any) => {
            const s = msg.server;
            if (!s.bound_to) {
                msg.il8nResponse('who.none');
            } else {
                msg.il8nResponse('who.okay', {
                    mymaster: s.bound_to.displayName,
                    permitted: buildPermittedString(s),
                });
            }
        },
        short_help: 'who.shorthelp',
        long_help: 'who.longhelp',
        group: 'server',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'who' });
}

module.exports = { data, execute, register, unRegister };
