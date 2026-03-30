/**
 * Amazon Polly TTS provider.
 * Auth: accessKeyId/secretAccessKey via aws4 HTTP signing.
 * Request: SSML text with voiceId, MP3 output.
 * Output: MP3 stream converted to Opus AudioResource via ffmpeg WASM.
 */
import type { VoiceRecord, AudioFormat, AudioContent, VoiceSettings } from '@src/types';

const Common = require('@helpers/common');
const ffmpegUtil = require('@helpers/ffmpeg');
const config = require('../../config-loader');
const ssmlvalid = require('ssml-validator');
const TextToSpeechService = require('@services/TextToSpeechService');
const MessageParser = require('@models/MessageParser');
const MessageSSML = require('@models/MessageSSML');
const polly = require('@services/tts/PollyTTS.js');

class AmazonTextToSpeechAPI extends TextToSpeechService {
    static polly: any;
    static voices: VoiceRecord[];
    static count: number;

    get shortname(): string {
        return 'amazon';
    }

    get enabled(): boolean {
        return config.tts && config.tts.amazon && config.tts.amazon.enabled;
    }

    get limit(): number {
        return config.tts.amazon.limit;
    }

    get format(): AudioFormat {
        return 'opus';
    }

    protected get defaultVoiceFallback(): string {
        return 'Kimberly';
    }

    get rate(): number {
        return 22050;
    }

    async startupTests(): Promise<void> {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID || config.tts?.amazon?.accessKeyId;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || config.tts?.amazon?.secretAccessKey;
        const region = process.env.AWS_REGION || config.tts?.amazon?.region;

        if (!secretAccessKey || !accessKeyId) {
            throw new Error('Config variable tts.amazon.accessKeyId or tts.amazon.secretAccessKey is not set.');
        }

        try {
            AmazonTextToSpeechAPI.polly = new polly({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                region: region || 'us-east-1',
            });
            AmazonTextToSpeechAPI.voices = await AmazonTextToSpeechAPI.buildVoices();
        } catch (err) {
            throw new Error(`Amazon TTS startup failed: ${err}`);
        }
        console.log('Loaded the Amazon TTS API credentials OK.');
    }

    buildRequest(msg: string, settings: VoiceSettings, server: unknown): unknown {
        if (!settings['amazon-xml-encode-disabled']) msg = ssmlvalid.correct(msg);
        if (!settings['amazon-breaths-disabled']) {
            msg = '<amazon:auto-breaths>' + msg + '</amazon:auto-breaths>';
        }

        const parser = new MessageParser(msg);
        const ssml = new MessageSSML(msg, { server: server }, parser).build();
        const options = {
            text: ssml,
            textType: 'ssml',
            voiceId: settings.name || this.getDefaultVoice('FEMALE', 'en-US'),
            outputFormat: 'mp3',
            sampleRate: this.rate,
        };

        return options;
    }

    async getAudioContent(
        request: any,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): Promise<void> {
        this.doBookkeeping(request);

        try {
            const audioStream = await AmazonTextToSpeechAPI.polly.textToSpeech(request);
            callback(null, async () => {
                return await ffmpegUtil.mp3ToReadableOpusBuffer(audioStream);
            });
        } catch (err: any) {
            Common.error(request);
            Common.error(err);
            callback(new Error(err), null);
            return;
        }
    }

    getVoices(): VoiceRecord[] {
        return AmazonTextToSpeechAPI.voices;
    }

    getDefaultVoice(gender: string, lang_code: string): string {
        const allVoices = AmazonTextToSpeechAPI.voices;
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
        const voices = AmazonTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code === lang_code) && (!gender || voice.gender === gender),
        );
        if (!voices.length) return this.defaultVoiceFallback;
        return voices[randnum % voices.length].voice;
    }

    protected doBookkeeping(request: { text: string }): void {
        if (!AmazonTextToSpeechAPI.count) AmazonTextToSpeechAPI.count = 0;
        AmazonTextToSpeechAPI.count += request.text.length;

        if (config.tts.amazon.enforce_limit && AmazonTextToSpeechAPI.count > this.limit) {
            throw new Error('Amazon limit reached');
        }
    }

    static async buildVoices(): Promise<VoiceRecord[]> {
        const voices = await AmazonTextToSpeechAPI.polly.describeVoices();

        return voices.Voices.map((voice: any) => {
            return {
                language: voice.LanguageName,
                code: voice.LanguageCode,
                translate: voice.LanguageCode.substr(0, 2),
                voice: voice.Id,
                gender: voice.Gender.toUpperCase(),
                provider: 'amazon',
                voice_alias: voice.Name,
            };
        });
    }

    async buildVoices(): Promise<VoiceRecord[]> {
        return AmazonTextToSpeechAPI.buildVoices();
    }
}

module.exports = AmazonTextToSpeechAPI;
