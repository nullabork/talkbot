import type { Readable } from 'stream';
import type { VoiceSettings } from './member-settings';

/**
 * A voice record as returned by TTS providers.
 * Shape enforced by TextToSpeechService.checkVoiceStructure().
 */
export interface VoiceRecord {
    /** Provider-native voice ID (e.g. 'en-AU-Standard-A') */
    voice: string;
    /** Human-readable alias (e.g. 'Mia') */
    voice_alias: string;
    gender: 'MALE' | 'FEMALE';
    /** Must match provider.shortname */
    provider: string;
    /** Human-readable language name */
    language: string;
    /** BCP-47 code (e.g. 'en-AU') */
    code: string;
    /** ISO-639-1 two-letter code (e.g. 'en') */
    translate: string;
    /** Google-only: 'Standard' | 'WaveNet' | 'Wavenet' */
    type?: string;
    /** Google-only: multiple language codes */
    codes?: string[];
    /** Watson-only */
    description?: string;
}

/**
 * Audio content returned by getAudioContent().
 * Either a Readable stream directly or an async factory function.
 */
export type AudioContent = Readable | (() => Promise<Readable>);

/** Audio format strings used across TTS providers */
export type AudioFormat = 'ogg' | 'ogg/opus' | 'opus' | 'mp3' | 'pcm' | 'ogg_vorbis';

/**
 * Contract that all TTS provider classes must implement.
 * Base class: src/services/TextToSpeechService.js
 */
export interface TTSProviderContract {
    readonly shortname: string;
    readonly enabled: boolean;
    readonly limit: number;
    readonly format: AudioFormat;

    startupTests(): Promise<void>;
    buildRequest(message: string, settings: VoiceSettings, server: unknown): unknown;
    getAudioContent(
        request: unknown,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): void;
    getVoices(): VoiceRecord[];
    getDefaultVoice(gender: string, lang_code: string): string;
    getRandomVoice(seed: number, gender: string, lang_code: string): string;
}

/**
 * AWS Polly voice shape as returned by describeVoices API.
 * Used internally by PollyTTS.js.
 */
export interface AWSPollyVoice {
    Gender: string;
    Id: string;
    LanguageCode: string;
    LanguageName: string;
    Name: string;
    SupportedEngines?: string[];
}

/** PollyTTS textToSpeech options */
export interface PollyTTSOptions {
    text: string;
    textType?: string;
    voiceId?: string;
    sampleRate?: number;
    outputFormat?: string;
    region?: string;
}
