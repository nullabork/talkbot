/**
 * Tencent Cloud TTS provider.
 * Auth: HMAC-SHA256 signed credentials.
 * Request: TextToVoiceRequest model with text/voice/codec.
 * Output: Opus audio as base64 in response.Audio.
 */
import type { VoiceRecord, AudioFormat, AudioContent, VoiceSettings } from '@src/types';

const config = require('../../config-loader');
const tencent = require('tencentcloud-sdk-nodejs');
const TextToSpeechService = require('@services/TextToSpeechService');

const ttsClient = tencent.tts.v20190823.Client;
const models = tencent.tts.v20190823.Models;
const { Credential, HttpProfile, ClientProfile } = tencent.common;

class TencentTextToSpeechAPI extends TextToSpeechService {
    static tencent: any;
    static voices: VoiceRecord[];
    static count: number;

    get shortname(): string {
        return 'tencent';
    }

    get enabled(): boolean {
        return config.tts && config.tts.tencent && config.tts.tencent.enabled;
    }

    get limit(): number {
        return config.tts.tencent.limit;
    }

    get format(): AudioFormat {
        return 'opus';
    }

    protected get defaultVoiceFallback(): string {
        return '0';
    }

    get rate(): number {
        return 22050;
    }

    async startupTests(): Promise<void> {
        const accessKeyId = process.env.TENCENT_ACCESS_KEY_ID || config.tts?.tencent?.accessKeyId;
        const secretAccessKey = process.env.TENCENT_SECRET_ACCESS_KEY || config.tts?.tencent?.secretAccessKey;

        if (!secretAccessKey || !accessKeyId) {
            throw new Error('Config variable tts.tencent.accessKeyId or tts.tencent.secretAccessKey is not set.');
        }

        try {
            const cred = new Credential(accessKeyId, secretAccessKey);
            const httpProfile = new HttpProfile();
            httpProfile.reqMethod = 'POST';
            httpProfile.reqTimeout = 30;
            httpProfile.endpoint = 'tts.tencentcloudapi.com';

            const clientProfile = new ClientProfile();
            clientProfile.signMethod = 'HmacSHA256';
            clientProfile.httpProfile = httpProfile;
            const client = new ttsClient(cred, 'ap-guangzhou', clientProfile);

            TencentTextToSpeechAPI.tencent = client;
            TencentTextToSpeechAPI.voices = await TencentTextToSpeechAPI.buildVoicesStatic();
        } catch (err) {
            throw new Error(`Tencent TTS startup failed: ${err}`);
        }
        console.log('Loaded the Tencent TTS API credentials OK.');
    }

    buildRequest(msg: string, settings: VoiceSettings, server: unknown): unknown {
        const req = new models.TextToVoiceRequest();
        req.Text = msg;
        req.SessionId = '';
        req.ModelType = 1;
        req.Volume = 5;
        req.Speed = 1;
        req.ProjectId = 0;
        // Fix: use `this` instead of undefined `self`
        req.VoiceType = settings.name || this.getDefaultVoice('FEMALE', 'en-US');
        req.PrimaryLanguage = 1;
        req.SampleRate = 16000;
        req.Codec = 'opus';

        return req;
    }

    async getAudioContent(
        request: any,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): Promise<void> {
        // Fix: use `this` for doBookkeeping; fix Text casing
        this.doBookkeeping({ text: request.Text });
        const cb = (err: Error | null, audioStream: any) => {
            callback(err, async () => audioStream.Audio);
        };

        TencentTextToSpeechAPI.tencent.TextToVoice(request, cb);
    }

    getVoices(): VoiceRecord[] {
        return TencentTextToSpeechAPI.voices;
    }

    getDefaultVoice(gender: string, lang_code: string): string {
        const allVoices = TencentTextToSpeechAPI.voices;
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
        const voices = TencentTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code === lang_code) && (!gender || voice.gender === gender),
        );
        if (!voices.length) return this.defaultVoiceFallback;
        return voices[randnum % voices.length].voice;
    }

    protected doBookkeeping(request: { text: string }): void {
        if (!TencentTextToSpeechAPI.count) TencentTextToSpeechAPI.count = 0;
        TencentTextToSpeechAPI.count += request.text.length;

        if (config.tts.tencent.enforce_limit && TencentTextToSpeechAPI.count > this.limit) {
            throw new Error('Tencent limit reached');
        }
    }

    static async buildVoicesStatic(): Promise<VoiceRecord[]> {
        /*
        0-Yun Xiaoning, female voice (default)
        1-Yun Xiaoqi, male voice
        1050-WeJack, English male voice
        1051-WeRose, English Female voice
        */
        return [
            {
                language: 'Chinese',
                code: 'cnn',
                translate: 'cnn',
                voice: '0',
                gender: 'FEMALE' as const,
                provider: 'tencent',
                voice_alias: 'Yun Xiaoning',
            },
        ];
    }

    async buildVoices(): Promise<VoiceRecord[]> {
        return TencentTextToSpeechAPI.buildVoicesStatic();
    }
}

module.exports = TencentTextToSpeechAPI;
