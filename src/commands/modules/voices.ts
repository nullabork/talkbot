import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';
import type { VoiceRecord } from '@src/types';

const TextToSpeechService = require('@services/TextToSpeechService');

const SAMPLES_URL = 'https://voices.talkbot.dev/';
const VOICE_PAGE_SIZE = 25;

// ── Helpers ─────────────────────────────────────────────────────────────────

function getLanguages(provider: string): string[] {
    const service = TextToSpeechService.getService(provider);
    if (!service) return [];
    const voices: VoiceRecord[] = service.getVoices();
    const langs = new Set<string>();
    for (const v of voices) langs.add(v.language || v.code || 'Unknown');
    return [...langs].sort();
}

function getVoicesForLang(provider: string, lang: string): VoiceRecord[] {
    const service = TextToSpeechService.getService(provider);
    if (!service) return [];
    const voices: VoiceRecord[] = service.getVoices();
    if (lang === '__all__') return voices;
    return voices.filter(v => (v.language || v.code || 'Unknown') === lang);
}

function samplesEmbed(commandChar: string, search?: string) {
    return {
        color: 0x0099ff,
        title: `Click to find voices${search ? ' for: ' + search + '.' : '.'}`,
        url: `${SAMPLES_URL}?chr=${encodeURI(commandChar)}&find=${encodeURI(search || '')}`,
        description: 'talkbot voice and voice sample database.',
        thumbnail: { url: 'https://voices.talkbot.dev/img/face_200.png' },
    };
}

// ── Component builders ──────────────────────────────────────────────────────

function buildProviderSelect(mode: 'browse' | 'set') {
    const providers = Object.keys(TextToSpeechService.providers);
    if (!providers.length) return null;

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`voices_provider:${mode}`)
        .setPlaceholder('Choose a TTS provider');

    for (const name of providers) {
        const count = TextToSpeechService.providers[name].getVoices().length;
        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(name)
                .setDescription(`${count} voices`)
                .setValue(name),
        );
    }

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function buildLangSelect(provider: string, mode: 'browse' | 'set') {
    const langs = getLanguages(provider);
    if (langs.length <= 1) return null; // skip if only one language

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`voices_lang:${mode}:${provider}`)
        .setPlaceholder('Filter by language');

    // Add "All" option first
    menu.addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('All languages')
            .setDescription(`Show all voices`)
            .setValue('__all__'),
    );

    for (const lang of langs.slice(0, 24)) { // 25 minus the "All" option
        const count = getVoicesForLang(provider, lang).length;
        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(lang.substring(0, 100))
                .setDescription(`${count} voices`)
                .setValue(lang),
        );
    }

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

const BROWSE_PAGE_SIZE = 15;

function buildVoiceEmbed(provider: string, lang: string, page: number, commandChar: string) {
    const voices = getVoicesForLang(provider, lang);
    const totalPages = Math.ceil(voices.length / BROWSE_PAGE_SIZE);
    const start = page * BROWSE_PAGE_SIZE;
    const pageVoices = voices.slice(start, start + BROWSE_PAGE_SIZE);

    const title = lang === '__all__'
        ? `${provider} — ${voices.length} voices`
        : `${provider} — ${lang} — ${voices.length} voices`;

    // Build table
    const nameW = Math.max(6, ...pageVoices.map(v => v.voice.length));
    const aliasW = Math.max(5, ...pageVoices.map(v => (v.voice_alias || '').length));

    const header = `${'Voice'.padEnd(nameW)}  ${'Alias'.padEnd(aliasW)}  Gender`;
    const sep = '─'.repeat(header.length);
    const rows = pageVoices.map(v =>
        `${v.voice.padEnd(nameW)}  ${(v.voice_alias || '').padEnd(aliasW)}  ${v.gender === 'FEMALE' ? 'F' : 'M'}`,
    );

    const table = '```\n' + [header, sep, ...rows].join('\n') + '\n```';

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(title)
        .setDescription(table)
        .setFooter({ text: `Page ${page + 1}/${totalPages} · ${commandChar}myvoice ${provider}/<voice>  or  ${commandChar}voices set` });

    const buttons = new ActionRowBuilder<ButtonBuilder>();

    if (page > 0) {
        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId(`voices_browsepage:${provider}:${lang}:${page - 1}`)
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary),
        );
    }
    if (page < totalPages - 1) {
        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId(`voices_browsepage:${provider}:${lang}:${page + 1}`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary),
        );
    }
    buttons.addComponents(
        new ButtonBuilder()
            .setCustomId('voices_back:browse')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary),
    );

    return { embeds: [embed], components: [buttons] };
}

function buildVoicePickerSelect(provider: string, lang: string, page: number) {
    const voices = getVoicesForLang(provider, lang);
    const totalPages = Math.ceil(voices.length / VOICE_PAGE_SIZE);
    const start = page * VOICE_PAGE_SIZE;
    const pageVoices = voices.slice(start, start + VOICE_PAGE_SIZE);

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`voices_pick:${provider}:${lang}:${page}`)
        .setPlaceholder(`Pick a voice (page ${page + 1}/${totalPages})`);

    for (const v of pageVoices) {
        const label = v.voice_alias !== v.voice ? v.voice_alias : v.voice;
        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(label.substring(0, 100))
                .setDescription(`${v.language} · ${v.gender}`.substring(0, 100))
                .setValue(v.voice),
        );
    }

    const rows: ActionRowBuilder<any>[] = [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
    ];

    if (totalPages > 1) {
        const buttons = new ActionRowBuilder<ButtonBuilder>();
        if (page > 0) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`voices_pickpage:${provider}:${lang}:${page - 1}`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary),
            );
        }
        if (page < totalPages - 1) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`voices_pickpage:${provider}:${lang}:${page + 1}`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary),
            );
        }
        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId('voices_back:set')
                .setLabel('Back to providers')
                .setStyle(ButtonStyle.Secondary),
        );
        rows.push(buttons);
    }

    return { content: `**${provider}** — pick a voice (page ${page + 1}/${totalPages})`, components: rows };
}

// ── Component interaction handler (called from index.ts) ────────────────────

export async function handleComponent(interaction: any): Promise<void> {
    const id: string = interaction.customId;

    // Back to provider selection
    if (id.startsWith('voices_back:')) {
        const mode = id.split(':')[1] as 'browse' | 'set';
        const row = buildProviderSelect(mode);
        if (!row) return;
        const label = mode === 'set' ? 'Pick a provider to set your voice:' : 'Pick a provider to browse voices:';
        await interaction.update({ content: label, embeds: [], components: [row] });
        return;
    }

    // Provider selected
    if (id.startsWith('voices_provider:') && interaction.isStringSelectMenu()) {
        const mode = id.split(':')[1] as 'browse' | 'set';
        const provider = interaction.values[0];
        const langs = getLanguages(provider);

        if (mode === 'browse') {
            if (langs.length <= 1) {
                const cmds = require('@commands');
                const world = require('@models/World');
                const server = world.servers[interaction.guildId!];
                const commandChar = server ? cmds.getCommandChar(server) : '!';
                const result = buildVoiceEmbed(provider, '__all__', 0, commandChar);
                await interaction.update({ content: null, ...result });
            } else {
                // Multiple languages — show language filter
                const langRow = buildLangSelect(provider, mode)!;
                await interaction.update({ content: `**${provider}** — pick a language:`, embeds: [], components: [langRow] });
            }
        } else {
            // Set mode — show language filter or go straight to voice picker
            if (langs.length <= 1) {
                const result = buildVoicePickerSelect(provider, '__all__', 0);
                await interaction.update({ ...result, embeds: [] });
            } else {
                const langRow = buildLangSelect(provider, mode)!;
                await interaction.update({ content: `**${provider}** — pick a language:`, embeds: [], components: [langRow] });
            }
        }
        return;
    }

    // Language selected
    if (id.startsWith('voices_lang:') && interaction.isStringSelectMenu()) {
        const parts = id.split(':');
        const mode = parts[1] as 'browse' | 'set';
        const provider = parts[2];
        const lang = interaction.values[0];

        if (mode === 'browse') {
            const cmds = require('@commands');
            const world = require('@models/World');
            const server = world.servers[interaction.guildId!];
            const commandChar = server ? cmds.getCommandChar(server) : '!';
            const result = buildVoiceEmbed(provider, lang, 0, commandChar);
            await interaction.update({ content: null, ...result });
        } else {
            const result = buildVoicePickerSelect(provider, lang, 0);
            await interaction.update({ ...result, embeds: [] });
        }
        return;
    }

    // Browse pagination
    if (id.startsWith('voices_browsepage:') && interaction.isButton()) {
        const [, provider, lang, pageStr] = id.split(':');
        const cmds = require('@commands');
        const world = require('@models/World');
        const server = world.servers[interaction.guildId!];
        const commandChar = server ? cmds.getCommandChar(server) : '!';
        const result = buildVoiceEmbed(provider, lang, parseInt(pageStr, 10), commandChar);
        await interaction.update({ content: null, ...result });
        return;
    }

    // Voice picker pagination
    if (id.startsWith('voices_pickpage:') && interaction.isButton()) {
        const [, provider, lang, pageStr] = id.split(':');
        const result = buildVoicePickerSelect(provider, lang, parseInt(pageStr, 10));
        await interaction.update({ ...result, embeds: [] });
        return;
    }

    // Voice picked → set it
    if (id.startsWith('voices_pick:') && interaction.isStringSelectMenu()) {
        const [, provider] = id.split(':');
        const voiceName = interaction.values[0];
        const voiceInfo = TextToSpeechService.getVoice(voiceName, provider);

        if (!voiceInfo) {
            await interaction.update({ content: `Voice **${voiceName}** not found.`, embeds: [], components: [] });
            return;
        }

        const world = require('@models/World');
        const server = world.servers[interaction.guildId!];
        if (!server) {
            await interaction.update({ content: 'Bot is not active in this server.', embeds: [], components: [] });
            return;
        }

        const member = interaction.guild?.members.cache.get(interaction.user.id);
        if (!member) {
            await interaction.update({ content: 'Could not find your member info.', embeds: [], components: [] });
            return;
        }

        server.addMemberSetting(member, 'voice_provider', voiceInfo.provider);
        server.addMemberSetting(member, 'name', voiceInfo.voice);
        server.addMemberSetting(member, 'alias', voiceInfo.voice_alias);
        server.deleteMemberSetting(member, 'toLanguage');

        const displayName = voiceInfo.voice_alias !== voiceInfo.voice
            ? `${voiceInfo.voice_alias} (${voiceInfo.voice})`
            : voiceInfo.voice;

        await interaction.update({
            content: `Voice set to **${voiceInfo.provider}/${displayName}** — ${voiceInfo.language}, ${voiceInfo.gender}`,
            embeds: [],
            components: [],
        });
    }
}

// ── Slash command ───────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
    .setName('voices')
    .setDescription('Browse or set your TTS voice')
    .addStringOption(option =>
        option.setName('action')
            .setDescription('"set" to pick a voice, "samples" for online database')
            .setRequired(false),
    ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const arg = interaction.options.getString('action');
    const cmds = require('@commands');
    const world = require('@models/World');
    const server = world.servers[interaction.guildId!];
    const commandChar = server ? cmds.getCommandChar(server) : '!';

    if (arg?.toLowerCase() === 'samples') {
        await interaction.reply({ embeds: [samplesEmbed(commandChar)] });
        return;
    }

    if (arg?.toLowerCase() === 'set') {
        const row = buildProviderSelect('set');
        if (!row) { await interaction.reply({ content: 'No TTS providers are enabled.', ephemeral: true }); return; }
        await interaction.reply({ content: 'Pick a provider to set your voice:', components: [row], ephemeral: true });
        return;
    }

    // Default: browse
    const row = buildProviderSelect('browse');
    if (!row) { await interaction.reply({ content: 'No TTS providers are enabled.', ephemeral: true }); return; }
    await interaction.reply({ content: 'Pick a provider to browse voices:', components: [row] });
}

// ── Legacy prefix command ───────────────────────────────────────────────────

export function register(commands: any): void {
    const BotCommand = require('@models/BotCommand');
    commands.add(new BotCommand({
        command_name: 'voices',
        command_arg: 'l',
        execute: (msg: any) => {
            const cmds = require('@commands');
            const commandChar = cmds.getCommandChar(msg.server);

            const arg = msg.args?.[0]?.toLowerCase();

            if (arg === 'samples') {
                msg.richResponse(samplesEmbed(commandChar, msg.args.slice(1).join(' ')));
                return;
            }

            const mode: 'browse' | 'set' = arg === 'set' ? 'set' : 'browse';
            const row = buildProviderSelect(mode);
            if (!row) { msg.response('No TTS providers are enabled.'); return; }

            const label = mode === 'set'
                ? 'Pick a provider to set your voice:'
                : 'Pick a provider to browse voices:';
            msg.message.channel.send({ content: label, components: [row] });
        },
        short_help: 'voices.shorthelp',
        long_help: 'voices.longhelp',
        group: 'info',
    }));
}

export function unRegister(commands: any): void {
    commands.remove({ command_name: 'voices' });
}

module.exports = { data, execute, register, unRegister, handleComponent };
