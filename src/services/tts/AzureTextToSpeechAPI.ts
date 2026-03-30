/**
 * Azure Cognitive Services TTS provider.
 * Auth: subscription key -> bearer token via issuetoken endpoint, refreshed every 10 min.
 * Request: SSML XML via xmlbuilder.
 * Output: ogg-24khz-16bit-mono-opus HTTP response stream.
 */
import type { VoiceRecord, AudioFormat, AudioContent, VoiceSettings } from '@src/types';

const Common = require('@helpers/common');
const TextToSpeechService = require('@services/TextToSpeechService');
const config = require('../../config-loader');
const rp = require('request-promise');
const xmlbuilder = require('xmlbuilder');

interface AzureVoiceRaw {
    ShortName: string;
    Locale: string;
    Gender: string;
}

class AzureTextToSpeechAPI extends TextToSpeechService {
    static voices: VoiceRecord[];
    private token: string = '';

    get shortname(): string {
        return 'azure';
    }

    get enabled(): boolean {
        return config.tts && config.tts.azure && config.tts.azure.enabled;
    }

    get baseUrl(): string {
        return process.env.AZURE_ENDPOINT || config.tts?.azure?.endpoint || 'https://eastus.tts.speech.microsoft.com/';
    }

    get limit(): number {
        return config.tts.azure.limit;
    }

    get format(): AudioFormat {
        return 'ogg/opus';
    }

    protected get defaultVoiceFallback(): string {
        return 'en-GB-Susan';
    }

    get accessToken(): string {
        return this.token;
    }

    set accessToken(value: string) {
        this.token = value;
    }

    async startupTests(): Promise<void> {
        const subscriptionKey = process.env.AZURE_SUBSCRIPTION_KEY || config.tts?.azure?.subscriptionKey;

        if (!subscriptionKey) {
            throw new Error('Config variable azure.subscriptionKey for your subscription key is not set.');
        }

        try {
            this.accessToken = await this.getAccessToken(subscriptionKey);

            // accessToken expires after an hour so we need to renew it
            setInterval(
                () =>
                    this.getAccessToken(subscriptionKey).then((token: string) => {
                        this.accessToken = token;
                    }),
                10 * 60 * 1000,
            );
            const v = await this.getVoicesFromAzure(this.accessToken);
            AzureTextToSpeechAPI.voices = this.processVoices(v);
        } catch (err) {
            throw new Error(`Azure TTS startup failed: ${err}`);
        }
        console.log('Loaded the Azure TTS API credentials OK.');
    }

    buildRequest(msg: string, settings: VoiceSettings, server: unknown): unknown {
        const xml_body = xmlbuilder
            .create('speak')
            .att('version', '1.0')
            .att('xmlns', 'https://www.w3.org/2001/10/synthesis')
            .att('xml:lang', settings.language ? settings.language.toLowerCase() : 'en-US')
            .ele('voice')
            .att('name', settings.name)
            .txt(msg)
            .end();

        const request = xml_body.toString();
        return request;
    }

    getAudioContent(
        request: unknown,
        callback: (err: Error | null, audio?: AudioContent | null) => void,
    ): void {
        const options = {
            method: 'POST',
            baseUrl: this.baseUrl,
            url: 'cognitiveservices/v1',
            headers: {
                Authorization: 'Bearer ' + this.accessToken,
                'cache-control': 'no-cache',
                'User-Agent': 'AzureTextToSpeechAPI',
                'X-Microsoft-OutputFormat': 'ogg-24khz-16bit-mono-opus',
                'Content-Type': 'application/ssml+xml',
            },
            body: request,
        };

        rp(options)
            .on('response', (response: any) => {
                if (response.statusCode === 200) {
                    callback(null, async () => response);
                } else {
                    Common.error(response);
                    callback(new Error('HTTP ERROR: ' + response.statusCode));
                }
            })
            .on('error', (err: Error) => callback(err));
    }

    getVoices(): VoiceRecord[] {
        return AzureTextToSpeechAPI.voices;
    }

    /**
     * 2-pass default voice fallback (not 3-pass):
     *   1. code + gender match
     *   2. hardcoded fallback
     */
    getDefaultVoice(gender: string, lang_code: string): string {
        if (!AzureTextToSpeechAPI.voices || !AzureTextToSpeechAPI.voices.length) {
            return this.defaultVoiceFallback;
        }
        const voices = AzureTextToSpeechAPI.voices.filter(
            (v) => v.code === lang_code && v.gender === gender,
        );
        if (voices.length) return voices[0].voice;
        return this.defaultVoiceFallback;
    }

    getRandomVoice(randnum: number, gender: string, lang_code: string): string {
        if (!randnum) randnum = Math.random() * 1000000;
        const voices = AzureTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code === lang_code) && (!gender || voice.gender === gender),
        );
        if (!voices.length) return this.defaultVoiceFallback;
        return voices[randnum % voices.length].voice;
    }

    getVoicesFromAzure(accessToken: string): Promise<AzureVoiceRaw[]> {
        const options = {
            method: 'GET',
            url: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/voices/list',
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
            },
            transform: (body: string) => JSON.parse(body),
            transform2xxOnly: true,
        };

        const p = rp(options)
            .then((response: AzureVoiceRaw[]) => {
                return response;
            })
            .catch((err: Error) => Common.error(err));
        return p;
    }

    processVoices(voices: AzureVoiceRaw[]): VoiceRecord[] {
        const v: VoiceRecord[] = [];

        for (const index in voices) {
            const voice = voices[index];

            const n: VoiceRecord = {
                provider: this.shortname,
                voice: voice.ShortName,
                code: voice.Locale,
                translate: voice.Locale.substring(0, 2),
                gender: this.standardiseGender(voice.Gender),
                voice_alias: voice.ShortName,
                language: voice.Locale,
            };

            v.push(n);
        }

        return v;
    }

    standardiseGender(token: string): 'MALE' | 'FEMALE' {
        if (!token) return 'FEMALE';
        if (token.substring(0, 1) === 'F') return 'FEMALE';
        if (token.substring(0, 1) === 'M') return 'MALE';
        return 'FEMALE';
    }

    async getAccessToken(subscriptionKey: string): Promise<string> {
        const options = {
            method: 'POST',
            uri: 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken',
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
            },
        };
        return rp(options);
    }

    async buildVoices(): Promise<VoiceRecord[]> {
        const v = await this.getVoicesFromAzure(this.accessToken);
        return this.processVoices(v);
    }
}

module.exports = AzureTextToSpeechAPI;
