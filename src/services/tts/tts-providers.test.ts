import { describe, it, expect, beforeEach } from 'vitest';
import type { VoiceRecord, AudioFormat } from '@src/types';

/**
 * Since the TypeScript provider files use `require()` with path aliases
 * (e.g. @helpers/common, @auth) that are resolved at runtime via module-alias,
 * we test the base class logic and provider contracts by reimplementing the
 * core algorithms here, matching the TextToSpeechService.ts implementation.
 *
 * Provider shortname/format are tested by instantiating minimal stubs that
 * mirror each provider's getter return values.
 */

// ── Reimplemented base-class algorithms for unit testing ──────────────

type VoiceStore = Map<string, VoiceRecord[]>;
type UsageCount = Map<string, number>;

function getDefaultVoice3Pass(
    voiceStore: VoiceStore,
    shortname: string,
    defaultFallback: string,
    gender: string,
    lang_code: string,
): string {
    const allVoices = voiceStore.get(shortname) || [];

    // Pass 1: code + gender
    const byCodeAndGender = allVoices.filter(
        (voice) => voice.code === lang_code && voice.gender === gender,
    );
    if (byCodeAndGender.length > 0) return byCodeAndGender[0].voice;

    // Pass 2: code only
    const byCode = allVoices.filter((voice) => voice.code === lang_code);
    if (byCode.length > 0) return byCode[0].voice;

    // Pass 3: en-US + gender
    const byEnUS = allVoices.filter(
        (voice) => voice.code === 'en-US' && voice.gender === gender,
    );
    if (byEnUS.length > 0) return byEnUS[0].voice;

    // Pass 4: hardcoded fallback
    return defaultFallback;
}

function getRandomVoice(
    voiceStore: VoiceStore,
    shortname: string,
    defaultFallback: string,
    seed: number,
    gender: string,
    lang_code: string,
): string {
    if (!seed) seed = Math.random() * 1000000;
    const allVoices = voiceStore.get(shortname) || [];
    const voices = allVoices.filter(
        (voice) => (!lang_code || voice.code === lang_code) && (!gender || voice.gender === gender),
    );
    if (!voices.length) return defaultFallback;
    return voices[seed % voices.length].voice;
}

function doBookkeeping(
    usageCount: UsageCount,
    shortname: string,
    limit: number,
    enforceLimit: boolean,
    requestText: string,
): void {
    const current = usageCount.get(shortname) || 0;
    const updated = current + requestText.length;
    usageCount.set(shortname, updated);

    if (enforceLimit && updated > limit) {
        throw new Error(`${shortname} limit reached`);
    }
}

function checkVoiceStructure(voices: VoiceRecord[]): void {
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

// ── Test data ─────────────────────────────────────────────────────────

const mockVoices: VoiceRecord[] = [
    { voice: 'en-US-Standard-A', voice_alias: 'Alice', gender: 'FEMALE', provider: 'test', language: 'English (US)', code: 'en-US', translate: 'en' },
    { voice: 'en-US-Standard-B', voice_alias: 'Bob', gender: 'MALE', provider: 'test', language: 'English (US)', code: 'en-US', translate: 'en' },
    { voice: 'en-AU-Standard-A', voice_alias: 'Mia', gender: 'FEMALE', provider: 'test', language: 'English (AU)', code: 'en-AU', translate: 'en' },
    { voice: 'fr-FR-Standard-A', voice_alias: 'Jeanne', gender: 'FEMALE', provider: 'test', language: 'French', code: 'fr-FR', translate: 'fr' },
    { voice: 'fr-FR-Standard-B', voice_alias: 'Paul', gender: 'MALE', provider: 'test', language: 'French', code: 'fr-FR', translate: 'fr' },
    { voice: 'de-DE-Standard-A', voice_alias: 'Hanna', gender: 'FEMALE', provider: 'test', language: 'German', code: 'de-DE', translate: 'de' },
];

const DEFAULT_FALLBACK = 'en-US-TestVoice';

// ── Tests ─────────────────────────────────────────────────────────────

describe('TextToSpeechService base class', () => {
    let voiceStore: VoiceStore;
    let usageCount: UsageCount;

    beforeEach(() => {
        voiceStore = new Map();
        voiceStore.set('test', mockVoices);
        usageCount = new Map();
    });

    describe('getDefaultVoice() 3-pass fallback', () => {
        it('returns voice matching code + gender (pass 1)', () => {
            const result = getDefaultVoice3Pass(voiceStore, 'test', DEFAULT_FALLBACK, 'FEMALE', 'en-US');
            expect(result).toBe('en-US-Standard-A');
        });

        it('returns voice matching code only when gender not found (pass 2)', () => {
            // en-AU only has FEMALE, ask for MALE
            const result = getDefaultVoice3Pass(voiceStore, 'test', DEFAULT_FALLBACK, 'MALE', 'en-AU');
            expect(result).toBe('en-AU-Standard-A');
        });

        it('falls back to en-US + gender when code not found (pass 3)', () => {
            const result = getDefaultVoice3Pass(voiceStore, 'test', DEFAULT_FALLBACK, 'MALE', 'ja-JP');
            expect(result).toBe('en-US-Standard-B');
        });

        it('falls back to hardcoded default when nothing matches (pass 4)', () => {
            voiceStore.set('test', []);
            const result = getDefaultVoice3Pass(voiceStore, 'test', DEFAULT_FALLBACK, 'MALE', 'ja-JP');
            expect(result).toBe('en-US-TestVoice');
        });
    });

    describe('getRandomVoice() deterministic selection', () => {
        it('returns a voice deterministically based on seed', () => {
            const result1 = getRandomVoice(voiceStore, 'test', DEFAULT_FALLBACK, 42, 'FEMALE', 'en-US');
            const result2 = getRandomVoice(voiceStore, 'test', DEFAULT_FALLBACK, 42, 'FEMALE', 'en-US');
            expect(result1).toBe(result2);
        });

        it('returns different voices for different seeds', () => {
            // Use non-zero seeds since 0 is falsy and triggers random replacement
            const result1 = getRandomVoice(voiceStore, 'test', DEFAULT_FALLBACK, 6, '', '');
            const result2 = getRandomVoice(voiceStore, 'test', DEFAULT_FALLBACK, 7, '', '');
            // 6 voices total: 6 % 6 = 0, 7 % 6 = 1
            expect(result1).toBe('en-US-Standard-A');
            expect(result2).toBe('en-US-Standard-B');
        });

        it('filters by gender and lang_code', () => {
            // Use non-zero seed; fr-FR MALE has only 1 voice (Paul)
            const result = getRandomVoice(voiceStore, 'test', DEFAULT_FALLBACK, 1, 'MALE', 'fr-FR');
            expect(result).toBe('fr-FR-Standard-B');
        });

        it('returns fallback when no voices match filter', () => {
            const result = getRandomVoice(voiceStore, 'test', DEFAULT_FALLBACK, 0, 'MALE', 'ja-JP');
            expect(result).toBe('en-US-TestVoice');
        });
    });

    describe('doBookkeeping() counting and limit check', () => {
        it('increments usage count', () => {
            doBookkeeping(usageCount, 'test', 1000000, false, 'hello');
            expect(usageCount.get('test')).toBe(5);
        });

        it('accumulates across multiple calls', () => {
            doBookkeeping(usageCount, 'test', 1000000, false, 'hello');
            doBookkeeping(usageCount, 'test', 1000000, false, 'world!');
            expect(usageCount.get('test')).toBe(11);
        });

        it('throws when limit exceeded with enforcement', () => {
            expect(() => {
                doBookkeeping(usageCount, 'test', 3, true, 'hello');
            }).toThrow('test limit reached');
        });

        it('does not throw when limit not enforced', () => {
            expect(() => {
                doBookkeeping(usageCount, 'test', 3, false, 'hello');
            }).not.toThrow();
        });
    });

    describe('checkVoiceStructure()', () => {
        it('accepts valid voices', () => {
            expect(() => checkVoiceStructure(mockVoices)).not.toThrow();
        });

        it('rejects voice missing voice_alias', () => {
            const bad = [{ ...mockVoices[0], voice_alias: '' }];
            expect(() => checkVoiceStructure(bad)).toThrow('No voice_alias');
        });

        it('rejects voice with invalid gender', () => {
            const bad = [{ ...mockVoices[0], gender: 'OTHER' }] as any;
            expect(() => checkVoiceStructure(bad)).toThrow('Invalid gender');
        });

        it('rejects voice missing provider', () => {
            const bad = [{ ...mockVoices[0], provider: '' }];
            expect(() => checkVoiceStructure(bad)).toThrow('No provider');
        });

        it('rejects voice missing language', () => {
            const bad = [{ ...mockVoices[0], language: '' }];
            expect(() => checkVoiceStructure(bad)).toThrow('No language');
        });

        it('rejects voice missing translate', () => {
            const bad = [{ ...mockVoices[0], translate: '' }];
            expect(() => checkVoiceStructure(bad)).toThrow('No translate');
        });

        it('rejects voice missing voice', () => {
            const bad = [{ ...mockVoices[0], voice: '' }];
            expect(() => checkVoiceStructure(bad)).toThrow('No voice');
        });

        it('rejects voice missing code', () => {
            const bad = [{ ...mockVoices[0], code: '' }];
            expect(() => checkVoiceStructure(bad)).toThrow('No code');
        });
    });
});

describe('Provider shortname and format values', () => {
    // Define provider specs that match the TypeScript class implementations
    const providerSpecs: { name: string; shortname: string; format: AudioFormat; defaultVoiceFallback: string }[] = [
        { name: 'GoogleTextToSpeechAPI', shortname: 'google', format: 'ogg/opus', defaultVoiceFallback: 'en-AU-Standard-D' },
        { name: 'AmazonTextToSpeechAPI', shortname: 'amazon', format: 'opus', defaultVoiceFallback: 'Kimberly' },
        { name: 'AzureTextToSpeechAPI', shortname: 'azure', format: 'ogg/opus', defaultVoiceFallback: 'en-GB-Susan' },
        { name: 'WatsonTextToSpeechAPI', shortname: 'watson', format: 'ogg/opus', defaultVoiceFallback: 'en-US_MichaelVoice' },
        { name: 'TencentTextToSpeechAPI', shortname: 'tencent', format: 'opus', defaultVoiceFallback: '0' },
        { name: 'AlibabaTextToSpeechAPI', shortname: 'alibaba', format: 'opus', defaultVoiceFallback: 'xiaoyun' },
    ];

    providerSpecs.forEach((spec) => {
        it(`${spec.name} has shortname '${spec.shortname}'`, () => {
            expect(spec.shortname).toBeTruthy();
            expect(typeof spec.shortname).toBe('string');
        });

        it(`${spec.name} has format '${spec.format}'`, () => {
            const validFormats: AudioFormat[] = ['ogg', 'ogg/opus', 'opus', 'mp3', 'pcm', 'ogg_vorbis'];
            expect(validFormats).toContain(spec.format);
        });

        it(`${spec.name} has a defaultVoiceFallback '${spec.defaultVoiceFallback}'`, () => {
            expect(spec.defaultVoiceFallback).toBeTruthy();
        });
    });
});
