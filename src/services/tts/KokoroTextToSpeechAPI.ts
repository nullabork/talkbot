/**
 * Kokoro local TTS provider.
 * Calls a Kokoro-FastAPI server (OpenAI-compatible /v1/audio/speech endpoint).
 * Returns OGG/Opus stream — no ffmpeg conversion needed.
 */
import type { VoiceRecord, AudioFormat, AudioContent, VoiceSettings } from '@src/types';
import { Readable } from 'stream';

const { createAudioResource, StreamType } = require('@discordjs/voice');
const Common = require('@helpers/common');
const ffmpegUtil = require('@helpers/ffmpeg');
const TextToSpeechService = require('@services/TextToSpeechService');

class KokoroTextToSpeechAPI extends TextToSpeechService {
    static voices: VoiceRecord[];
    static count: number = 0;

    private get baseUrl(): string {
        return process.env.KOKORO_BASE_URL || 'http://localhost:8880';
    }

    private get defaultVoice(): string {
        return process.env.KOKORO_DEFAULT_VOICE || 'af_heart';
    }

    get shortname(): string {
        return 'kokoro';
    }

    get format(): AudioFormat {
        return 'opus';
    }

    protected get defaultVoiceFallback(): string {
        return this.defaultVoice;
    }

    async startupTests(): Promise<void> {
        // Wait for the Kokoro server to become healthy (it may still be loading the model)
        const maxRetries = 30;
        const retryDelay = 5000;
        let lastErr: string = '';

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const res = await fetch(`${this.baseUrl}/health`);
                if (res.ok) break;
                lastErr = `health check returned ${res.status}`;
            } catch (err: any) {
                lastErr = err.message;
            }

            if (attempt === maxRetries) {
                throw new Error(
                    `Kokoro TTS server not reachable at ${this.baseUrl} after ${maxRetries} attempts. ` +
                    `Make sure the kokoro-tts service is running. (${lastErr})`,
                );
            }

            console.log(`Waiting for Kokoro TTS server... (attempt ${attempt}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, retryDelay));
        }

        try {
            KokoroTextToSpeechAPI.voices = await KokoroTextToSpeechAPI.buildVoicesFromAPI(this.baseUrl);
        } catch (err) {
            throw new Error(`Kokoro TTS voice fetch failed: ${err}`);
        }

        console.log('Loaded the Kokoro TTS API credentials OK.');
    }

    buildRequest(msg: string, settings: VoiceSettings, _server: unknown): unknown {
        return {
            model: 'kokoro',
            input: msg,
            voice: settings.name || this.defaultVoice,
            response_format: 'mp3',
            speed: settings.speed || 1.0,
            stream: true,
        };
    }

    async getAudioContent(
        request: any,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): Promise<void> {
        console.log('[Kokoro] getAudioContent called:', request.input?.substring(0, 50));

        try {
            this.doBookkeeping({ text: request.input });
        } catch (err: any) {
            console.error('[Kokoro] doBookkeeping failed:', err.message);
            callback(err, null);
            return;
        }

        let res: Response;
        try {
            console.log(`[Kokoro] Fetching ${this.baseUrl}/v1/audio/speech`);
            res = await fetch(`${this.baseUrl}/v1/audio/speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
            console.log(`[Kokoro] Response status: ${res.status}, content-type: ${res.headers.get('content-type')}`);
        } catch (err: any) {
            console.error('[Kokoro] Fetch failed:', err.message);
            callback(new Error(`Kokoro fetch failed: ${err.message}`), null);
            return;
        }

        if (!res.ok) {
            const body = await res.text().catch(() => '(could not read body)');
            console.error(`[Kokoro] API error ${res.status}: ${body}`);
            callback(new Error(`Kokoro API error ${res.status}: ${body}`), null);
            return;
        }

        let buffer: Buffer;
        try {
            const arrayBuf = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuf);
            console.log(`[Kokoro] Received ${buffer.length} bytes, first 4: ${buffer.slice(0, 4).toString('hex')}`);
        } catch (err: any) {
            console.error('[Kokoro] Failed to read response body:', err.message);
            callback(new Error(`Kokoro body read failed: ${err.message}`), null);
            return;
        }

        if (!buffer.length) {
            console.error('[Kokoro] Empty response body');
            callback(new Error('Kokoro returned empty audio'), null);
            return;
        }

        callback(null, async () => {
            console.log('[Kokoro] Thunk called — converting MP3 to Opus via ffmpeg');
            try {
                const mp3Stream = new Readable({
                    read() {
                        this.push(buffer);
                        this.push(null);
                    },
                });
                const resource = await ffmpegUtil.mp3ToReadableOpusBuffer(mp3Stream);
                console.log('[Kokoro] AudioResource created OK');
                return resource;
            } catch (err: any) {
                console.error('[Kokoro] ffmpeg conversion failed:', err.message);
                throw err;
            }
        });
    }

    getVoices(): VoiceRecord[] {
        return KokoroTextToSpeechAPI.voices || [];
    }

    async buildVoices(): Promise<VoiceRecord[]> {
        return KokoroTextToSpeechAPI.buildVoicesFromAPI(this.baseUrl);
    }

    protected doBookkeeping(request: { text: string }): void {
        const config = require('../../config-loader');
        KokoroTextToSpeechAPI.count += request.text.length;
        if (config.tts?.kokoro?.enforce_limit && KokoroTextToSpeechAPI.count > this.limit) {
            throw new Error('Kokoro limit reached');
        }
    }

    /**
     * Fetch voices from Kokoro's /v1/audio/voices endpoint.
     * Voice names follow the pattern: {lang}{gender}_{name}
     *   af_ = American English female, am_ = American English male
     *   bf_ = British English female,  bm_ = British English male
     *   etc.
     */
    static async buildVoicesFromAPI(baseUrl: string): Promise<VoiceRecord[]> {
        const res = await fetch(`${baseUrl}/v1/audio/voices`);
        if (!res.ok) throw new Error(`Failed to fetch Kokoro voices: ${res.status}`);

        const data: any = await res.json();
        // The endpoint returns { voices: [...] } with voice ID strings
        const voiceIds: string[] = data.voices || data;

        const langMap: Record<string, { language: string; code: string; translate: string }> = {
            a: { language: 'English (American)', code: 'en-US', translate: 'en' },
            b: { language: 'English (British)', code: 'en-GB', translate: 'en' },
            e: { language: 'Spanish', code: 'es-ES', translate: 'es' },
            f: { language: 'French', code: 'fr-FR', translate: 'fr' },
            h: { language: 'Hindi', code: 'hi-IN', translate: 'hi' },
            i: { language: 'Italian', code: 'it-IT', translate: 'it' },
            j: { language: 'Japanese', code: 'ja-JP', translate: 'ja' },
            p: { language: 'Portuguese (Brazilian)', code: 'pt-BR', translate: 'pt' },
            z: { language: 'Chinese', code: 'zh-CN', translate: 'zh' },
        };

        const genderMap: Record<string, 'MALE' | 'FEMALE'> = { f: 'FEMALE', m: 'MALE' };

        return voiceIds
            .filter((id) => id.length >= 3 && id[1] === 'f' || id[1] === 'm')
            .map((id): VoiceRecord => {
                const langChar = id[0];
                const genderChar = id[1];
                const lang = langMap[langChar] || { language: 'Unknown', code: 'en-US', translate: 'en' };
                const namePart = id.includes('_') ? id.split('_').slice(1).join('_') : id;

                return {
                    voice: id,
                    voice_alias: namePart,
                    gender: genderMap[genderChar] || 'FEMALE',
                    provider: 'kokoro',
                    language: lang.language,
                    code: lang.code,
                    translate: lang.translate,
                };
            });
    }
}

module.exports = KokoroTextToSpeechAPI;
