/**
 * IBM Watson TTS provider.
 * Auth: IAM API key via IamAuthenticator.
 * Request: plain text with voice name and audio/ogg;codecs=opus accept header.
 * Output: OGG/Opus stream via Watson SDK.
 */
import type { VoiceRecord, AudioFormat, AudioContent, VoiceSettings } from '@src/types';

const Common = require('@helpers/common');
const config = require('../../config-loader');
const TextToSpeechService = require('@services/TextToSpeechService');
const { IamAuthenticator } = require('ibm-watson/auth');
const watson = require('ibm-watson/text-to-speech/v1');

class WatsonTextToSpeechAPI extends TextToSpeechService {
    static watson: any;
    static voices: VoiceRecord[];
    static count: number;

    get shortname(): string {
        return 'watson';
    }

    get enabled(): boolean {
        return config.tts && config.tts.watson && config.tts.watson.enabled;
    }

    get limit(): number {
        return config.tts.watson.limit;
    }

    get format(): AudioFormat {
        return 'ogg/opus';
    }

    protected get defaultVoiceFallback(): string {
        return 'en-US_MichaelVoice';
    }

    get rate(): number {
        return 22050;
    }

    async startupTests(): Promise<void> {
        const apiKey = process.env.WATSON_API_KEY || config.tts?.watson?.apikey;
        const serviceUrl = process.env.WATSON_SERVICE_URL || config.tts?.watson?.serviceUrl;

        if (!apiKey) {
            throw new Error('Config variable tts.watson.apikey not set.');
        }

        try {
            WatsonTextToSpeechAPI.watson = new watson({
                authenticator: new IamAuthenticator({
                    apikey: apiKey,
                }),
                serviceUrl: serviceUrl,
            });
            WatsonTextToSpeechAPI.voices = await WatsonTextToSpeechAPI.buildVoicesStatic();
        } catch (err) {
            throw new Error(`Watson TTS startup failed: ${err}`);
        }
        console.log('Loaded the Watson TTS API credentials OK.');
    }

    buildRequest(msg: string, settings: VoiceSettings, server: unknown): unknown {
        const synthesizeParams = {
            text: msg,
            accept: 'audio/ogg;codecs=opus',
            voice: settings.name || this.getDefaultVoice('FEMALE', 'en-US'),
        };

        return synthesizeParams;
    }

    async getAudioContent(
        request: any,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): Promise<void> {
        this.doBookkeeping(request);
        try {
            const audioStream = await WatsonTextToSpeechAPI.watson.synthesize(request);
            callback(null, async () => audioStream.result);
        } catch (err: any) {
            Common.error(request);
            Common.error(err);
            callback(new Error(err), null);
            return;
        }
    }

    getVoices(): VoiceRecord[] {
        return WatsonTextToSpeechAPI.voices;
    }

    /** Hardcoded return — Watson has limited voice selection */
    getDefaultVoice(gender: string, lang_code: string): string {
        return this.defaultVoiceFallback;
    }

    /** No filter — return any voice by index */
    getRandomVoice(randnum: number, gender: string, lang_code: string): string {
        if (!randnum) randnum = Math.random() * 1000000;
        const voices = WatsonTextToSpeechAPI.voices;
        if (!voices || !voices.length) return this.defaultVoiceFallback;
        return voices[randnum % voices.length].voice;
    }

    protected doBookkeeping(request: { text: string }): void {
        if (!WatsonTextToSpeechAPI.count) WatsonTextToSpeechAPI.count = 0;
        WatsonTextToSpeechAPI.count += request.text.length;

        if (config.tts.watson.enforce_limit && WatsonTextToSpeechAPI.count > this.limit) {
            throw new Error('Watson limit reached');
        }
    }

    static async buildVoicesStatic(): Promise<VoiceRecord[]> {
        const voices = await WatsonTextToSpeechAPI.watson.listVoices();

        return voices.result.voices.map((voice: any) => {
            return {
                language: voice.language,
                code: voice.language,
                translate: voice.language.substr(0, 2),
                voice: voice.name,
                gender: voice.gender.toUpperCase(),
                provider: 'watson',
                voice_alias: voice.name,
                description: voice.description,
            };
        });
    }

    async buildVoices(): Promise<VoiceRecord[]> {
        return WatsonTextToSpeechAPI.buildVoicesStatic();
    }
}

module.exports = WatsonTextToSpeechAPI;
