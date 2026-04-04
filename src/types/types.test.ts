import { describe, it, expect } from 'vitest';
import type {
    BotConfig,
    ServerStateData,
    MemberSettings,
    VoiceRecord,
    ListenerType,
    CommentBuilderData,
    SSMLTagData,
    TextRules,
    VoiceSettings,
    AudioFormat,
} from './index';

describe('types', () => {
    it('BotConfig matches config.example.json shape', () => {
        const botConfig: BotConfig = {
            servers: {
                '-1': { pester_threshold: 100000, daily_char_limit: 10000 },
            },
            tts: {
                google: { enabled: true, enforce_limit: false, limit: 5000000 },
                amazon: {
                    enabled: true,
                    region: 'us-east-1',
                    accessKeyId: '',
                    secretAccessKey: '',
                    enforce_limit: false,
                    limit: 5000000,
                },
            },
        };
        expect(botConfig.tts!.google?.enabled).toBe(true);
    });

    it('BotConfig allows all optional TTS providers to be absent', () => {
        const botConfig: BotConfig = {
            servers: {},
            tts: {},
        };
        expect(botConfig.tts!.google).toBeUndefined();
        expect(botConfig.tts!.azure).toBeUndefined();
    });

    it('ServerStateData matches .server file shape', () => {
        const state: ServerStateData = {
            server_id: '123',
            server_name: 'Test Server',
            audioEmojis: {},
            memberSettings: {},
            textrules: { 'o\\/': 'wave' },
            permitted: {},
            defaultProvider: '',
            language: 'en-AU',
            adminrole: '',
            restrictions: [],
            bind: [],
            bindPermit: false,
            keepMessages: {},
            stats: { characterCount: 0 },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            charLimit: 100000,
            fallbackLang: 'en',
            messages: {},
        };
        expect(state.server_id).toBe('123');
    });

    it('MemberSettings accepts all known keys plus arbitrary extensions', () => {
        const settings: MemberSettings = {
            name: 'en-AU-Standard-A',
            alias: 'Mia',
            voice_provider: 'google',
            pitch: 0,
            speed: 1.0,
            gender: 'FEMALE',
            code: 'en-AU',
            toLanguage: 'en',
            muted: false,
            mytitle: 'Boss',
            announceme: 'on',
            'amazon-xml-encode-disabled': false,
            'amazon-breaths-disabled': false,
            customModuleKey: 'arbitrary',
        };
        expect(settings.name).toBe('en-AU-Standard-A');
        expect(settings.customModuleKey).toBe('arbitrary');
    });

    it('VoiceRecord matches provider voice structure', () => {
        const voice: VoiceRecord = {
            voice: 'en-AU-Standard-A',
            voice_alias: 'Mia',
            gender: 'FEMALE',
            provider: 'google',
            language: 'English (Australia)',
            code: 'en-AU',
            translate: 'en',
            type: 'Standard',
            codes: ['en-AU'],
        };
        expect(voice.gender).toBe('FEMALE');
    });

    it('VoiceRecord works without optional Google/Watson fields', () => {
        const voice: VoiceRecord = {
            voice: 'Amy',
            voice_alias: 'Amy',
            gender: 'FEMALE',
            provider: 'amazon',
            language: 'English (US)',
            code: 'en-US',
            translate: 'en',
        };
        expect(voice.type).toBeUndefined();
        expect(voice.codes).toBeUndefined();
    });

    it('VoiceSettings is a subset of MemberSettings', () => {
        const settings: VoiceSettings = {
            name: 'test-voice',
            pitch: 0,
            speed: 1.0,
            voice_provider: 'google',
        };
        expect(settings.name).toBe('test-voice');
    });

    it('AudioFormat accepts all known formats', () => {
        const formats: AudioFormat[] = ['ogg', 'ogg/opus', 'opus', 'mp3', 'pcm', 'ogg_vorbis'];
        expect(formats).toHaveLength(6);
    });

    it('TextRules is a string-to-string record', () => {
        const rules: TextRules = { 'o\\/': 'wave', '\\\\o': 'wave ack' };
        expect(Object.keys(rules)).toHaveLength(2);
    });

    it('ListenerType covers all 12 event types', () => {
        const types: ListenerType[] = [
            'token', 'message', 'validate', 'preValidate',
            'messageDelivered', 'joinVoice', 'leaveVoice',
            'follow', 'unfollow', 'configureVoice',
            'userJoinedChannel', 'configureSettings',
        ];
        expect(types).toHaveLength(12);
    });

    it('SSMLTagData matches ssml-dictionary entries', () => {
        const tag: SSMLTagData = {
            open: '***',
            close: '***',
            type: 'emphasis',
            attributes: { level: 'strong', volume: '+6dB' },
        };
        expect(tag.type).toBe('emphasis');
    });

    it('CommentBuilderData accepts all constructor options', () => {
        const data: CommentBuilderData = {
            padding: ' ',
            formatKey: true,
            data: { _heading: 'Test', _data: { key: 'value' } },
            keyMap: { key: 'Key Name' },
        };
        expect(data.formatKey).toBe(true);
    });
});
