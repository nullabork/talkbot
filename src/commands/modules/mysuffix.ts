import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('mysuffix')
    .setDescription('Set a suffix spoken after your messages')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('on')
            .setDescription('Enable your suffix'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('off')
            .setDescription('Disable your suffix'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('set')
            .setDescription('Set your suffix text')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('The suffix text')
                    .setRequired(true),
            ),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const mysuffix = server.getMemberSetting(member, 'mysuffix') || {
        suffix: member.displayName, enabled: false,
    };

    const sub = interaction.options.getString('action') || interaction.options.getSubcommand();
    if (sub === 'on') {
        mysuffix.enabled = true;
        server.addMemberSetting(member, 'mysuffix', mysuffix);
        await interaction.reply(server.lang('mysuffix.on', { setting: mysuffix.suffix }));
    } else if (sub === 'off') {
        mysuffix.enabled = false;
        server.addMemberSetting(member, 'mysuffix', mysuffix);
        await interaction.reply(server.lang('mysuffix.off'));
    } else if (sub === 'set') {
        const text = interaction.options.getString('text');
        if (!text) { await interaction.reply({ content: 'Please provide text for the suffix.', ephemeral: true }); return; }
        mysuffix.suffix = text;
        server.addMemberSetting(member, 'mysuffix', mysuffix);
        await interaction.reply(server.lang('mysuffix.setokay', { setting: mysuffix.suffix }));
    }
}

// Message listener for TTS pipeline
function onMessage({ message, content, modified, server }: any): string | null {
    const member = message.member;
    const mysuffix = server.getMemberSetting(member, 'mysuffix');
    if (mysuffix && mysuffix.enabled) {
        const suffix = mysuffix.suffix || member.displayName;
        return (modified || content) + ' ' + suffix;
    }
    return null;
}

export const listeners = {
    message: onMessage,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'mysuffix',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            const mysuffix = s.getMemberSetting(m, 'mysuffix') || {
                suffix: m.displayName, enabled: false,
            };
            if (!msg.args || msg.args.length === 0) {
                msg.il8nResponse('mysuffix.usage');
                return;
            }
            const sub = msg.args[0].toLowerCase();
            if (sub === 'on') {
                mysuffix.enabled = true;
                s.addMemberSetting(m, 'mysuffix', mysuffix);
                msg.il8nResponse('mysuffix.on', { setting: mysuffix.suffix });
            } else if (sub === 'off') {
                mysuffix.enabled = false;
                s.addMemberSetting(m, 'mysuffix', mysuffix);
                msg.il8nResponse('mysuffix.off');
            } else {
                mysuffix.suffix = msg.args.join(' ');
                s.addMemberSetting(m, 'mysuffix', mysuffix);
                msg.il8nResponse('mysuffix.setokay', { setting: mysuffix.suffix });
            }
        },
        short_help: 'mysuffix.shorthelp',
        long_help: 'mysuffix.longhelp',
        group: 'personalization',
        listeners: {
            message: onMessage,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'mysuffix' });
}

module.exports = { data, execute, listeners, register, unRegister };
