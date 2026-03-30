import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('myvoice')
    .setDescription('Set your TTS voice')
    .addStringOption(option =>
        option.setName('voice')
            .setDescription('Voice name (provider/voice or just voice)')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const TextToSpeechService = require('@services/TextToSpeechService');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const voiceArg = interaction.options.getString('voice', true);

    if (voiceArg === 'default') {
        server.addMemberSetting(member, 'voice_provider', 'default');
        server.addMemberSetting(member, 'name', 'default');
        server.addMemberSetting(member, 'alias', 'default');
        await interaction.reply(server.lang('general.auto', { key: 'myvoice' }));
        return;
    }

    const tokens = voiceArg.split('/');
    let provider = '';
    let voice = '';

    if (tokens.length === 1) voice = tokens[0];
    else if (tokens.length >= 2) {
        provider = tokens[0];
        voice = tokens[1];
    }

    const voiceInfo = TextToSpeechService.getVoice(voice, provider);
    if (voiceInfo) {
        server.addMemberSetting(member, 'voice_provider', voiceInfo.provider);
        server.addMemberSetting(member, 'name', voiceInfo.voice);
        server.addMemberSetting(member, 'alias', voiceInfo.voice_alias);
        server.deleteMemberSetting(member, 'toLanguage');
        await interaction.reply(server.lang('myvoice.okay', {
            voice: voiceInfo.voice_alias || voiceInfo.voice,
            provider: voiceInfo.provider,
        }));
    } else {
        await interaction.reply(server.lang('myvoice.no', { voice: voiceArg }));
    }
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const TextToSpeechService = require('@services/TextToSpeechService');
    commands.add(new BotCommand({
        command_name: 'myvoice',
        command_arg: 'l',
        execute: (msg: any) => {
            const s = msg.server;
            const m = msg.message.member;
            const settings = s.getMemberSettings(m);
            if (!m) return;
            if (!msg.args || !msg.args.length) {
                msg.il8nResponse('myvoice.more', {
                    provider: settings.voice_provider || 'default',
                    voice: settings.name || 'default',
                    alias: settings.alias || 'default',
                });
                return;
            }
            if (msg.args[0] === 'default') {
                s.addMemberSetting(m, 'voice_provider', 'default');
                s.addMemberSetting(m, 'name', 'default');
                s.addMemberSetting(m, 'alias', 'default');
                msg.il8nResponse('general.auto', { key: 'myvoice' });
                return;
            }
            const tokens = msg.args[0].split('/');
            let provider = '', voice = '';
            if (tokens.length === 1) voice = tokens[0];
            else { provider = tokens[0]; voice = tokens[1]; }
            const vi = TextToSpeechService.getVoice(voice, provider);
            if (vi) {
                s.addMemberSetting(m, 'voice_provider', vi.provider);
                s.addMemberSetting(m, 'name', vi.voice);
                s.addMemberSetting(m, 'alias', vi.voice_alias);
                s.deleteMemberSetting(m, 'toLanguage');
                msg.il8nResponse('myvoice.okay', { voice: vi.voice_alias || vi.voice, provider: vi.provider });
            } else {
                msg.il8nResponse('myvoice.no', { voice: msg.args[0] });
            }
        },
        short_help: 'myvoice.shorthelp',
        long_help: 'myvoice.longhelp',
        group: 'personalization',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'myvoice' });
}

module.exports = { data, execute, register, unRegister };
