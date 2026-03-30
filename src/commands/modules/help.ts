import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands')
    .addStringOption(option =>
        option.setName('group')
            .setDescription('Command group to show help for')
            .setRequired(false)
            .addChoices(
                { name: 'personalization', value: 'personalization' },
                { name: 'control', value: 'control' },
                { name: 'info', value: 'info' },
                { name: 'server', value: 'server' },
            ),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getString('group');
    const CommentBuilder = require('@models/CommentBuilder');
    const cmds = require('@commands');
    const Common = require('@helpers/common');
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];

    if (group) {
        let c: Record<string, string> | null = null;
        for (const command in cmds.commands) {
            const cmd = cmds.commands[command];
            if (cmd.hidden) continue;
            if (!cmd.group || cmd.group.toLowerCase() !== group.toLowerCase()) continue;
            if (!c) c = {};
            const cmdParams = cmd.parameters ? ` ${cmd.parameters}` : '';
            const helpText = server ? server.lang(cmd.short_help) : cmd.short_help;
            c['/' + cmd.command_name + cmdParams] = helpText + '\n';
        }

        if (!c) {
            await interaction.reply('No commands found for that group.');
            return;
        }

        const b = CommentBuilder.create({
            data: { [Common.camelize(group)]: c },
        });
        await interaction.reply(b);
        return;
    }

    const helpData: Record<string, any> = {
        Quickstart: [
            '1. Join a voice channel',
            '2. Type /talkbot do follow',
            '3. Type a message to hear the bot speak',
            '4. Browse voices with /talkbot info voices',
        ],
        Control: {
            '/talkbot do follow': 'Bot joins your voice channel',
            '/talkbot do unfollow': 'Bot leaves voice channel',
            '/talkbot do tts': 'Force-speak a message',
            '/talkbot do stop': 'Stop current playback',
            '/talkbot do mute': 'Mute a user',
            '/talkbot do unmute': 'Unmute a user',
            '/talkbot do sidle': 'Take over as master',
            '/talkbot do transfer': 'Transfer master to another user',
        },
        Voice: {
            '/talkbot voice set': 'Set your TTS voice',
            '/talkbot voice pitch': 'Set voice pitch (-20 to 20)',
            '/talkbot voice speed': 'Set voice speed (0.25 to 4.0)',
            '/talkbot voice tolang': 'Set translation language',
            '/talkbot voice defaults': 'Reset all voice settings',
            '/talkbot voice title': 'Set your display title',
            '/talkbot voice puberty': 'Toggle random pitch/speed',
            '/talkbot voice announceme': 'Toggle join/leave announcements',
            '/talkbot voice prefix': 'Set message prefix',
            '/talkbot voice suffix': 'Set message suffix',
        },
        Server: {
            '/talkbot server permit': 'Allow a user to speak',
            '/talkbot server unpermit': 'Revoke speak permission',
            '/talkbot server sfx': 'Manage sound effects',
            '/talkbot server textrule': 'Manage text replacement rules',
            '/talkbot server bind': 'Auto-follow configuration',
            '/talkbot server restrict': 'Restrict to specific channels',
            '/talkbot server adminrole': 'Set bot admin role',
            '/talkbot server keep': 'Auto-delete old messages',
        },
        Info: {
            '/talkbot info ping': 'Check bot latency',
            '/talkbot info who': 'Show master and permitted users',
            '/talkbot info voices': 'Browse available voices',
            '/talkbot info stats': 'Show usage statistics',
            '/talkbot info details': 'Show user voice settings',
            '/talkbot info invite': 'Get bot invite link',
        },
        Links: [
            'Documentation:    https://nullabork.gitbook.io/talkbot/',
            'Join our discord: https://discord.com/invite/NxrPp8g',
        ],
    };

    const result = CommentBuilder.create({ data: helpData });
    await interaction.reply(result);
}

function buildHelpEmbed(commands: any, server: any, filterGroup?: string): any {
    const { EmbedBuilder } = require('discord.js');
    const char = commands.getCommandChar(server);

    const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('TalkBot Commands')
        .setURL('https://github.com/nullabork/talkbot')
        .setFooter({ text: `Use ${char}help <group> for detailed help on a specific group` });

    // Collect commands by group
    const groups: Record<string, { name: string; desc: string }[]> = {};
    for (const key in commands.commands) {
        const cmd = commands.commands[key];
        if (cmd.hidden) continue;
        const g = (cmd.group || 'other').toLowerCase();
        if (filterGroup && g !== filterGroup) continue;
        if (!groups[g]) groups[g] = [];
        const helpText = server ? server.lang(cmd.short_help) : cmd.short_help;
        groups[g].push({ name: `${char}${cmd.command_name}`, desc: helpText });
    }

    if (filterGroup && !groups[filterGroup]) {
        return null;
    }

    // If no filter, add quickstart
    if (!filterGroup) {
        embed.setDescription(
            `**Quick Start**\n` +
            `1. Join a voice channel\n` +
            `2. Type \`${char}follow\`\n` +
            `3. Type a message to hear the bot speak\n` +
            `4. Choose a voice with \`${char}voices\``,
        );
    }

    // Sort groups in a nice order
    const groupOrder = ['control', 'personalization', 'info', 'server', 'other'];
    const sortedGroups = Object.keys(groups).sort((a, b) => {
        const ai = groupOrder.indexOf(a);
        const bi = groupOrder.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    for (const g of sortedGroups) {
        const cmds = groups[g];
        const lines = cmds.map((c) => `\`${c.name}\` ${c.desc}`).join('\n');
        const title = g.charAt(0).toUpperCase() + g.slice(1);
        embed.addFields({ name: title, value: lines || 'No commands' });
    }

    return embed;
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'help',
        execute: (msg: any) => {
            const group = msg.args && msg.args[0] ? msg.args[0].toLowerCase() : null;
            const embed = buildHelpEmbed(commands, msg.server, group || undefined);
            if (!embed) {
                msg.response('No commands found for that group.');
                return;
            }
            try {
                msg.message.channel.send({ embeds: [embed] });
            } catch (_e) {
                // Fallback to plain text if embeds fail
                msg.response('Use !help control, !help personalization, !help info, or !help server');
            }
        },
        short_help: 'help.shorthelp',
        long_help: 'help.longhelp',
        group: 'info',
        order: 99,
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'help' });
}

module.exports = { data, execute, register, unRegister };
