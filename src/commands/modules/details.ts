import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('details')
    .setDescription('Show voice settings for a user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to show details for')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const CommentBuilder = require('@models/CommentBuilder');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const target = interaction.guild?.members.cache.get(targetUser.id);
    if (!target) { await interaction.reply({ content: 'Could not find that member.', ephemeral: true }); return; }

    const settings = server.getMemberSettings(target);

    if (!settings || !Object.keys(settings).length) {
        await interaction.reply(CommentBuilder.create({
            data: {
                _heading: server.lang('details.none', { user: target.displayName }),
                _data: null,
            },
        }));
        return;
    }

    await interaction.reply(CommentBuilder.create({
        data: {
            _heading: server.lang('details.for', { user: target.displayName }),
            _data: settings,
        },
        keyMap: {
            name: 'My Voice',
            pitch: 'My Pitch',
            speed: 'My Speed',
            toLanguage: 'To Lang',
        },
    }));
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const CommentBuilder = require('@models/CommentBuilder');
    commands.add(new BotCommand({
        command_name: 'details',
        execute: (msg: any) => {
            const tgt = msg.message.mentions.members.first() || msg.message.member;
            const s = msg.server.getMemberSettings(tgt);
            if (!s || !Object.keys(s).length) {
                return msg.response(CommentBuilder.create({
                    data: { _heading: msg.server.lang('details.none', { user: tgt.displayName }), _data: null },
                }));
            }
            msg.response(CommentBuilder.create({
                data: { _heading: msg.server.lang('details.for', { user: tgt.displayName }), _data: s },
                keyMap: { name: 'My Voice', pitch: 'My Pitch', speed: 'My Speed', toLanguage: 'To Lang' },
            }));
        },
        short_help: 'details.shorthelp',
        long_help: 'details.longhelp',
        hidden: true,
        group: 'Info',
        parameters: '<user_name>...',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'details' });
}

module.exports = { data, execute, register, unRegister };
