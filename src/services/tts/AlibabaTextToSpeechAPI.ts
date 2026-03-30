/**
 * Alibaba Cloud TTS provider (DISABLED).
 * Auth: appkey/token.
 * NOTE: Audio pipeline non-functional -- requires uninstalled lame/samplerate/prism packages.
 */
import type { VoiceRecord, AudioFormat, AudioContent, VoiceSettings } from '@src/types';

const Common = require('@helpers/common');
const config = require('../../config-loader');
const TextToSpeechService = require('@services/TextToSpeechService');

class AlibabaTextToSpeechAPI extends TextToSpeechService {
    static appkey: string;
    static token: string;
    static endpoint: string;
    static voices: VoiceRecord[];
    static count: number;

    get shortname(): string {
        return 'alibaba';
    }

    /** Hardcoded to false -- provider is non-functional */
    get enabled(): boolean {
        return false;
    }

    get limit(): number {
        return config.tts?.alibaba?.limit ?? 4 * 1000 * 1000;
    }

    get format(): AudioFormat {
        return 'opus';
    }

    protected get defaultVoiceFallback(): string {
        return 'xiaoyun';
    }

    get rate(): number {
        return 22050;
    }

    async startupTests(): Promise<void> {
        const appkey = process.env.ALIBABA_APP_KEY || config.tts?.alibaba?.appkey;
        const token = process.env.ALIBABA_TOKEN || config.tts?.alibaba?.token;
        const endpoint = process.env.ALIBABA_ENDPOINT || config.tts?.alibaba?.endpoint;

        if (!appkey || !token || !endpoint) {
            throw new Error(
                'Config variable tts.alibaba.appkey or tts.alibaba.token or tts.alibaba.endpoint is not set.',
            );
        }

        try {
            AlibabaTextToSpeechAPI.appkey = appkey;
            AlibabaTextToSpeechAPI.token = token;
            AlibabaTextToSpeechAPI.endpoint = endpoint;
            AlibabaTextToSpeechAPI.voices = await AlibabaTextToSpeechAPI.buildVoicesStatic();
        } catch (err) {
            throw new Error(`Alibaba TTS startup failed: ${err}`);
        }
        console.log('Loaded the Alibaba TTS API credentials OK.');
    }

    buildRequest(msg: string, settings: VoiceSettings, server: unknown): unknown {
        const options = {
            token: AlibabaTextToSpeechAPI.token,
            appkey: AlibabaTextToSpeechAPI.appkey,
            text: msg,
            voice: settings.name || this.getDefaultVoice('FEMALE', 'en-US'),
            format: 'mp3',
            sample_rate: '16000',
            speech_rate: 0,
            pitch_rate: 0,
            volume: 50,
        };

        return options;
    }

    /**
     * NOTE: getAudioContent is non-functional.
     * The original implementation depends on uninstalled packages: lame, samplerate, prism.
     * This method is kept as a stub for contract compliance.
     */
    async getAudioContent(
        request: any,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): Promise<void> {
        this.doBookkeeping(request);
        callback(
            new Error('Alibaba TTS audio pipeline is non-functional (missing lame/samplerate/prism deps)'),
            null,
        );
    }

    getVoices(): VoiceRecord[] {
        return AlibabaTextToSpeechAPI.voices;
    }

    getDefaultVoice(gender: string, lang_code: string): string {
        const allVoices = AlibabaTextToSpeechAPI.voices;
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

    getRandomVoice(randnum: number, gender: string, lang_code: string): string {
        if (!randnum) randnum = Math.random() * 1000000;
        const voices = AlibabaTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code === lang_code) && (!gender || voice.gender === gender),
        );
        if (!voices.length) return this.defaultVoiceFallback;
        return voices[randnum % voices.length].voice;
    }

    protected doBookkeeping(request: { text: string }): void {
        if (!AlibabaTextToSpeechAPI.count) AlibabaTextToSpeechAPI.count = 0;
        AlibabaTextToSpeechAPI.count += request.text.length;

        if (config.tts?.alibaba?.enforce_limit && AlibabaTextToSpeechAPI.count > this.limit) {
            throw new Error('Alibaba limit reached');
        }
    }

    static async buildVoicesStatic(): Promise<VoiceRecord[]> {
        return [
            {
                language: 'Chinese',
                code: 'cnm',
                translate: 'cn',
                voice: 'xiaoyun',
                gender: 'FEMALE' as const,
                provider: 'alibaba',
                voice_alias: 'xiaoyun',
            },
        ];
    }

    async buildVoices(): Promise<VoiceRecord[]> {
        return AlibabaTextToSpeechAPI.buildVoicesStatic();
    }
}

module.exports = AlibabaTextToSpeechAPI;
