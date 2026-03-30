import type { VoiceRecord, AudioFormat, AudioContent, VoiceSettings } from '@src/types';

const Common = require('@helpers/common');
const fs = require('fs');
const paths = require('../paths');

/**
 * Base class for building specific TTS APIs over.
 * Each provider extends this and implements the abstract members.
 */
abstract class TextToSpeechService {
    // ── Shared static storage ──────────────────────────────────────────
    protected static voiceStore: Map<string, VoiceRecord[]> = new Map();
    protected static usageCount: Map<string, number> = new Map();
    static providers: Record<string, TextToSpeechService> = {};

    // ── Abstract getters that each provider must implement ──────────────
    abstract get shortname(): string;
    abstract get format(): AudioFormat;
    protected abstract get defaultVoiceFallback(): string;

    // ── Abstract methods that each provider must implement ──────────────
    abstract startupTests(): Promise<void>;
    abstract buildRequest(message: string, settings: VoiceSettings, server: unknown): unknown;
    abstract getAudioContent(
        request: unknown,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): void;
    abstract buildVoices(): Promise<VoiceRecord[]> | VoiceRecord[];

    // ── Common getters (read from bot config) ───────────────────────────
    get enabled(): boolean {
        const config = require('../config-loader');
        return config.tts?.[this.shortname]?.enabled ?? false;
    }

    get limit(): number {
        const config = require('../config-loader');
        return config.tts?.[this.shortname]?.limit ?? 4 * 1000 * 1000;
    }

    // ── Common instance methods ────────────────────────────────────────

    /** Read voices from voiceStore keyed by this.shortname */
    getVoices(): VoiceRecord[] {
        return TextToSpeechService.voiceStore.get(this.shortname) || [];
    }

    /**
     * Get a deterministic random voice using seed modulo.
     * Filters by gender and lang_code when provided.
     */
    getRandomVoice(seed: number, gender: string, lang_code: string): string {
        if (!seed) seed = Math.random() * 1000000;
        const allVoices = this.getVoices();
        const voices = allVoices.filter(
            (voice) => (!lang_code || voice.code === lang_code) && (!gender || voice.gender === gender),
        );
        if (!voices.length) return this.defaultVoiceFallback;
        return voices[seed % voices.length].voice;
    }

    /**
     * 3-pass default voice fallback:
     *   1. code + gender match
     *   2. code only match
     *   3. en-US + gender match
     *   4. hardcoded defaultVoiceFallback
     */
    getDefaultVoice(gender: string, lang_code: string): string {
        const allVoices = this.getVoices();
        const byCodeAndGender = allVoices.filter(
            (voice) => voice.code === lang_code && voice.gender === gender,
        );
        if (byCodeAndGender.length > 0) return byCodeAndGender[0].voice;

        const byCode = allVoices.filter((voice) => voice.code === lang_code);
        if (byCode.length > 0) return byCode[0].voice;

        const byEnUS = allVoices.filter(
            (voice) => voice.code === 'en-US' && voice.gender === gender,
        );
        if (byEnUS.length > 0) return byEnUS[0].voice;

        return this.defaultVoiceFallback;
    }

    /** Common counting + limit check */
    protected doBookkeeping(request: { text: string }): void {
        const config = require('../config-loader');
        const name = this.shortname;
        const current = TextToSpeechService.usageCount.get(name) || 0;
        const updated = current + request.text.length;
        TextToSpeechService.usageCount.set(name, updated);

        if (config.tts?.[name]?.enforce_limit && updated > this.limit) {
            throw new Error(`${name} limit reached`);
        }
    }

    // ── Static methods ─────────────────────────────────────────────────

    static async setupProviders(): Promise<void> {
        TextToSpeechService.providers = {};
        const files: string[] = fs.readdirSync(paths.tts)
            .filter((f: string) => f.endsWith('.js') && !f.endsWith('.test.js') && !f.endsWith('.map') && f !== 'PollyTTS.js');

        for (const file of files) {
            try {
                const api = require(paths.tts + '/' + file);
                if (!api) continue;

                const obj: TextToSpeechService = new api();
                if (obj.enabled) {
                    await obj.startupTests();
                    await TextToSpeechService.checkProviderContract(obj);
                    TextToSpeechService.providers[obj.shortname] = obj;
                }
            } catch (err) {
                Common.error('Error loading provider: ' + file);
                Common.error(err);
                // Don't exit — skip this provider and continue with others
            }
        }
    }

    /**
     * Find the API based on the provider name.
     */
    static getService(provider: string): TextToSpeechService | null {
        if (!provider) return null;
        provider = provider.toLowerCase();
        const service = TextToSpeechService.providers[provider];
        return service || null;
    }

    /**
     * Checks the provider meets the contract.
     */
    static checkProviderContract(provider: TextToSpeechService): void {
        if (
            provider.format !== 'pcm' &&
            provider.format !== 'ogg' &&
            provider.format !== 'ogg_vorbis' &&
            provider.format !== 'mp3' &&
            provider.format !== 'ogg/opus' &&
            provider.format !== 'opus'
        ) {
            throw new Error('Unknown provider format');
        }
        if (!provider.shortname) throw new Error('Provider shortname needs to be set');

        const voices = provider.getVoices();
        if (voices.filter((voice) => voice.provider !== provider.shortname).length > 0) {
            throw new Error('A voice has an incorrect provider string');
        }
        TextToSpeechService.checkVoiceStructure(voices);

        // Smoke-test the default voice lookup
        provider.getDefaultVoice('FEMALE', 'en-US');
    }

    /**
     * Confirm the voices array is formed correctly.
     */
    static checkVoiceStructure(voices: VoiceRecord[]): void {
        for (const voice of voices) {
            if (!voice.voice_alias) throw new Error('No voice_alias property:' + voice.voice);
            if (voice.gender !== 'MALE' && voice.gender !== 'FEMALE') {
                throw new Error('Invalid gender property: ' + voice.gender);
            }
            if (!voice.provider) throw new Error('No provider property');
            if (!voice.language) throw new Error('No language property');
            if (!voice.translate) throw new Error('No translate property');
            if (!voice.voice) throw new Error('No voice property');
            if (!voice.code) throw new Error('No code property');
        }
    }

    /** Get the first enabled provider */
    static get defaultProvider(): TextToSpeechService | undefined {
        const key = Object.keys(TextToSpeechService.providers).filter(
            (x) => TextToSpeechService.providers[x].enabled,
        )[0];
        return TextToSpeechService.providers[key];
    }

    /**
     * Tests if the lang_code is valid.
     */
    static isValidLang(lang_code: string, provider?: string): boolean {
        return TextToSpeechService.getVoiceRecords(lang_code, provider).length > 0;
    }

    static getVoiceRecords(lang_code: string, provider?: string): VoiceRecord[] {
        if (provider) {
            const service = TextToSpeechService.getService(provider);
            if (!service) return [];
            const voices = service
                .getVoices()
                .filter(
                    (voice) => voice.code.toLowerCase().indexOf(lang_code.toLowerCase()) > -1,
                );
            return voices;
        } else {
            const v: VoiceRecord[] = [];
            for (const p in TextToSpeechService.providers) {
                TextToSpeechService.providers[p]
                    .getVoices()
                    .filter(
                        (voice) => voice.code.toLowerCase().indexOf(lang_code.toLowerCase()) > -1,
                    )
                    .forEach((voice) => v.push(voice));
            }
            return v;
        }
    }

    static getRandomProvider(): TextToSpeechService {
        const r = Math.random() * 100000;
        const keys = Object.keys(TextToSpeechService.providers);
        return TextToSpeechService.providers[keys[r % keys.length]];
    }

    static getVoice(voice_name: string, provider?: string): VoiceRecord | null {
        let v: VoiceRecord | null = null;
        let service: TextToSpeechService | null = null;
        voice_name = voice_name.toLowerCase();

        if (provider) service = TextToSpeechService.getService(provider);

        if (service) {
            const voices = service.getVoices();
            for (const key in voices) {
                v = voices[key];
                if (
                    v.voice.toLowerCase() === voice_name ||
                    v.voice_alias.toLowerCase() === voice_name
                ) {
                    return v;
                }
            }
        } else {
            for (const svc in TextToSpeechService.providers) {
                const voices = TextToSpeechService.providers[svc].getVoices();
                for (const key in voices) {
                    v = voices[key];
                    if (
                        v.voice.toLowerCase() === voice_name ||
                        v.voice_alias.toLowerCase() === voice_name
                    ) {
                        return v;
                    }
                }
            }
        }
        return null;
    }
}

module.exports = TextToSpeechService;
