import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('announceme')
    .setDescription('Toggle voice join/leave announcements')
    .addStringOption(option =>
        option.setName('toggle')
            .setDescription('Turn announcements on or off')
            .setRequired(true)
            .addChoices(
                { name: 'on', value: 'on' },
                { name: 'off', value: 'off' },
            ),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const mode = interaction.options.getString('toggle', true);
    server.addMemberSetting(member, 'announceme', mode);

    if (mode === 'on') {
        await interaction.reply(server.lang('announceme.on'));
    } else {
        await interaction.reply(server.lang('announceme.off'));
    }
}

// Listener functions for TTS pipeline
function onFollow({ member, server }: any): void {
    const MessageSSML = require('@models/MessageSSML');
    const title = server.getMemberSetting(member, 'mytitle') || server.world.default_title;
    if (server.getMemberSetting(member, 'announceme') === 'on') {
        const msg = server.lang('announceme.announcejoin', {
            title, name: member.displayName, verb: 'arrived',
        });
        const ssml = new MessageSSML(msg, { server }).build();
        server.talk(ssml);
    }
}

function onUnfollow({ member, server }: any): void {
    const MessageSSML = require('@models/MessageSSML');
    const title = server.getMemberSetting(member, 'mytitle') || server.world.default_title;
    if (server.getMemberSetting(member, 'announceme') === 'on') {
        const msg = server.lang('announceme.announceleave', {
            title, name: member.displayName, verb: 'departed',
        });
        const ssml = new MessageSSML(msg, { server }).build();
        server.talk(ssml);
    }
}

export const listeners = {
    follow: onFollow,
    unfollow: onUnfollow,
};

export const sequence = { message: 0, token: 0 };

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'announceme',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!msg.args || msg.args.length === 0) {
                msg.il8nResponse('announceme.usage');
                return;
            }
            const mode = msg.args[0].toLowerCase();
            s.addMemberSetting(m, 'announceme', mode);
            if (mode === 'on') {
                msg.il8nResponse('announceme.on');
            } else {
                msg.il8nResponse('announceme.off');
            }
        },
        short_help: 'announceme.shorthelp',
        long_help: 'announceme.longhelp',
        group: 'personalization',
        listeners: {
            follow: onFollow,
            unfollow: onUnfollow,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'announceme' });
}

module.exports = { data, execute, listeners, sequence, register, unRegister };
