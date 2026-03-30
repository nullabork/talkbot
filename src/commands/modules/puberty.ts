import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('puberty')
    .setDescription('Toggle puberty mode (randomize pitch/speed)')
    .addStringOption(option =>
        option.setName('toggle')
            .setDescription('Turn puberty mode on or off')
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
    server.addMemberSetting(member, 'puberty', mode);

    if (mode === 'on') {
        await interaction.reply(server.lang('puberty.on'));
    } else {
        await interaction.reply(server.lang('puberty.off'));
    }
}

// configureVoice listener for TTS pipeline
function onConfigureVoice({ message, server, original_settings }: any): any {
    const settings = server.world.lastSettings;
    if (original_settings.pitch || original_settings.speed) {
        server.world.lastSettings = Object.assign({}, original_settings);
    }
    if (settings && server.getMemberSetting(message.member, 'puberty') === 'on') {
        if (settings.pitch) original_settings.pitch = settings.pitch;
        if (settings.speed) original_settings.speed = settings.speed;
        return original_settings;
    }
    return null;
}

export const listeners = {
    configureVoice: onConfigureVoice,
};

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'puberty',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            if (!msg.args || msg.args.length === 0) {
                msg.il8nResponse('puberty.usage');
                return;
            }
            const mode = msg.args[0].toLowerCase();
            s.addMemberSetting(m, 'puberty', mode);
            if (mode === 'on') {
                msg.il8nResponse('puberty.on');
            } else {
                msg.il8nResponse('puberty.off');
            }
        },
        short_help: 'puberty.shorthelp',
        long_help: 'puberty.longhelp',
        group: 'personalization',
        listeners: {
            configureVoice: onConfigureVoice,
        },
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'puberty' });
}

module.exports = { data, execute, listeners, register, unRegister };
