import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('tolang')
    .setDescription('Set your translation language')
    .addStringOption(option =>
        option.setName('language')
            .setDescription('Language code (e.g., en, fr, de)')
            .setRequired(true),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const world = require('@models/World');
    const TextToSpeechService = require('@services/TextToSpeechService');
    const server = world.servers[interaction.guildId!];
    if (!server) { await interaction.reply({ content: 'Bot is not active in this server.', ephemeral: true }); return; }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) { await interaction.reply({ content: 'Could not find your member info.', ephemeral: true }); return; }

    const langCode = interaction.options.getString('language', true);

    if (/default|off|none|unset|0/.test(langCode)) {
        server.addMemberSetting(member, 'toLanguage', 'default');
        await interaction.reply(server.lang('general.auto', { key: 'tolang' }));
        return;
    }

    if (!TextToSpeechService.isValidLang(langCode)) {
        await interaction.reply(server.lang('mylang.no', { lang: langCode }));
        return;
    }

    const voices = TextToSpeechService.getVoiceRecords(langCode);
    const voice = voices[0];

    server.addMemberSetting(member, 'toLanguage', voice.translate);
    server.addMemberSetting(member, 'language', voice.code);
    server.addMemberSetting(member, 'voice_provider', voice.provider);

    let response = server.lang('tolang.okay', { lang: voice.language });

    const voiceName = server.getMemberSetting(member, 'name');
    if (voiceName && voiceName !== 'default') {
        response += '\n' + server.lang('myvoice.noped');
    }

    server.addMemberSetting(member, 'name', 'default');
    await interaction.reply(response);
}

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    const TextToSpeechService = require('@services/TextToSpeechService');
    commands.add(new BotCommand({
        command_name: 'tolang',
        command_arg: 't',
        execute: (msg: any) => {
            const s = msg.server;
            if (!msg.args || !msg.args.length) { msg.il8nResponse('tolang.more'); return; }
            if (/default|off|none|unset|0/.test(msg.args[0])) {
                s.addMemberSetting(msg.message.member, 'toLanguage', 'default');
                msg.il8nResponse('general.auto', { key: 'tolang' });
                return;
            }
            const lc = msg.args[0];
            if (!TextToSpeechService.isValidLang(lc)) {
                msg.il8nResponse('mylang.no', { lang: msg.args[0] });
                return;
            }
            const voices = TextToSpeechService.getVoiceRecords(lc);
            const voice = voices[0];
            s.addMemberSetting(msg.message.member, 'toLanguage', voice.translate);
            s.addMemberSetting(msg.message.member, 'language', voice.code);
            s.addMemberSetting(msg.message.member, 'voice_provider', voice.provider);
            let response = s.lang('tolang.okay', { lang: voice.language });
            const vn = s.getMemberSetting(msg.message.member, 'name');
            if (vn && vn !== 'default') response += '\n' + s.lang('myvoice.noped');
            s.addMemberSetting(msg.message.member, 'name', 'default');
            msg.response(response);
        },
        short_help: 'tolang.shorthelp',
        long_help: 'tolang.longhelp',
        group: 'personalization',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'tolang' });
}

module.exports = { data, execute, register, unRegister };
