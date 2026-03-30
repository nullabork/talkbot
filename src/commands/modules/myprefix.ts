import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('myprefix')
    .setDescription('Set a prefix spoken before your messages')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('on')
            .setDescription('Enable your prefix'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('off')
            .setDescription('Disable your prefix'),
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) =>
        sub.setName('set')
            .setDescription('Set your prefix text')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('The prefix text')
                    .setRequired(true),
            ),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const myprefix = server.getMemberSetting(member, 'myprefix') || {
        prefix: member.displayName, enabled: false,
    };

    const sub = interaction.options.getString('action') || interaction.options.getSubcommand();
    if (sub === 'on') {
        myprefix.enabled = true;
        server.addMemberSetting(member, 'myprefix', myprefix);
        await interaction.reply(server.lang('myprefix.on', { setting: myprefix.prefix }));
    } else if (sub === 'off') {
        myprefix.enabled = false;
        server.addMemberSetting(member, 'myprefix', myprefix);
        await interaction.reply(server.lang('myprefix.off'));
    } else if (sub === 'set') {
        const text = interaction.options.getString('text');
        if (!text) { await interaction.reply({ content: 'Please provide text for the prefix.', ephemeral: true }); return; }
        myprefix.prefix = text;
        server.addMemberSetting(member, 'myprefix', myprefix);
        await interaction.reply(server.lang('myprefix.setokay', { setting: myprefix.prefix }));
    }
}

// Message listener for TTS pipeline
function onMessage({ message, content, modified, server }: any): string | null {
    const member = message.member;
    const myprefix = server.getMemberSetting(member, 'myprefix');
    if (myprefix && myprefix.enabled) {
        const prefix = myprefix.prefix || member.displayName;
        return prefix + ' ' + (modified || content);
    }
    return null;
}

export const listeners = {
    message: onMessage,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'myprefix',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            const myprefix = s.getMemberSetting(m, 'myprefix') || {
                prefix: m.displayName, enabled: false,
            };
            if (!msg.args || msg.args.length === 0) {
                msg.il8nResponse('myprefix.usage');
                return;
            }
            const sub = msg.args[0].toLowerCase();
            if (sub === 'on') {
                myprefix.enabled = true;
                s.addMemberSetting(m, 'myprefix', myprefix);
                msg.il8nResponse('myprefix.on', { setting: myprefix.prefix });
            } else if (sub === 'off') {
                myprefix.enabled = false;
                s.addMemberSetting(m, 'myprefix', myprefix);
                msg.il8nResponse('myprefix.off');
            } else {
                myprefix.prefix = msg.args.join(' ');
                s.addMemberSetting(m, 'myprefix', myprefix);
                msg.il8nResponse('myprefix.setokay', { setting: myprefix.prefix });
            }
        },
        short_help: 'myprefix.shorthelp',
        long_help: 'myprefix.longhelp',
        group: 'personalization',
        listeners: {
            message: onMessage,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'myprefix' });
}

module.exports = { data, execute, listeners, register, unRegister };
