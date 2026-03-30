import { describe, it, expect } from 'vitest';
import type { VoiceRecord } from '@src/types';

/**
 * TTS integration tests — validates voice structure, default voice selection,
 * provider voice records, and filtering/lookup logic using the same algorithms
 * as TextToSpeechService and the provider classes.
 */

// ── Reimplemented core algorithms (matching TextToSpeechService.ts) ──

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

function getDefaultVoice(
    voices: VoiceRecord[],
    defaultFallback: string,
    gender: string,
    lang_code: string,
): string {
    const byCodeAndGender = voices.filter(
        (voice) => voice.code === lang_code && voice.gender === gender,
    );
    if (byCodeAndGender.length > 0) return byCodeAndGender[0].voice;

    const byCode = voices.filter((voice) => voice.code === lang_code);
    if (byCode.length > 0) return byCode[0].voice;

    const byEnUS = voices.filter(
        (voice) => voice.code === 'en-US' && voice.gender === gender,
    );
    if (byEnUS.length > 0) return byEnUS[0].voice;

    return defaultFallback;
}

function getService(providers: Record<string, string>, name: string): string | null {
    return providers[name] || null;
}

function isValidLang(voices: VoiceRecord[], langCode: string): boolean {
    return voices.some((v) => v.code === langCode);
}

function getVoiceRecords(voices: VoiceRecord[], langPrefix: string): VoiceRecord[] {
    return voices.filter((v) => v.translate === langPrefix);
}

// ── Hardcoded voice data from providers ──

const googleHardcodedVoices: VoiceRecord[] = [
    { language: 'Danish', code: 'da-DK', translate: 'da', voice: 'da-DK-Standard-A', voice_alias: 'Dora', gender: 'FEMALE', provider: 'google' },
    { language: 'English (Australia)', code: 'en-AU', voice: 'en-AU-Standard-A', translate: 'en', voice_alias: 'Mia', gender: 'FEMALE', provider: 'google' },
    { language: 'English (Australia)', code: 'en-AU', translate: 'en', voice: 'en-AU-Standard-B', voice_alias: 'Oliver', gender: 'MALE', provider: 'google' },
    { language: 'English (US)', code: 'en-US', translate: 'en', voice: 'en-US-Standard-B', voice_alias: 'Liam', gender: 'MALE', provider: 'google' },
    { language: 'English (US)', code: 'en-US', translate: 'en', voice: 'en-US-Standard-C', voice_alias: 'Emma', gender: 'FEMALE', provider: 'google' },
    { language: 'French (France)', code: 'fr-FR', translate: 'fr', voice: 'fr-FR-Standard-B', voice_alias: 'jean-luc-picard', gender: 'MALE', provider: 'google' },
];

const amazonHardcodedVoices: VoiceRecord[] = [
    { language: 'English (US)', code: 'en-US', translate: 'en', voice: 'Kimberly', voice_alias: 'Kimberly', gender: 'FEMALE', provider: 'amazon' },
    { language: 'English (US)', code: 'en-US', translate: 'en', voice: 'Matthew', voice_alias: 'Matthew', gender: 'MALE', provider: 'amazon' },
    { language: 'English (AU)', code: 'en-AU', translate: 'en', voice: 'Nicole', voice_alias: 'Nicole', gender: 'FEMALE', provider: 'amazon' },
];

const tencentHardcodedVoices: VoiceRecord[] = [
    { language: 'Chinese', code: 'cnn', translate: 'cnn', voice: '0', gender: 'FEMALE', provider: 'tencent', voice_alias: 'Yun Xiaoning' },
];

const alibabaHardcodedVoices: VoiceRecord[] = [
    { language: 'Chinese', code: 'cnm', translate: 'cn', voice: 'xiaoyun', gender: 'FEMALE', provider: 'alibaba', voice_alias: 'xiaoyun' },
];

// ── Tests ──

describe('TTS Integration — checkVoiceStructure', () => {
    it('validates Google hardcoded voices', () => {
        expect(() => checkVoiceStructure(googleHardcodedVoices)).not.toThrow();
    });

    it('validates Amazon hardcoded voices', () => {
        expect(() => checkVoiceStructure(amazonHardcodedVoices)).not.toThrow();
    });

    it('validates Tencent hardcoded voices', () => {
        expect(() => checkVoiceStructure(tencentHardcodedVoices)).not.toThrow();
    });

    it('validates Alibaba hardcoded voices', () => {
        expect(() => checkVoiceStructure(alibabaHardcodedVoices)).not.toThrow();
    });

    it('rejects voice missing required voice field', () => {
        const bad: VoiceRecord[] = [
            { language: 'Test', code: 'en-US', translate: 'en', voice: '', voice_alias: 'Test', gender: 'FEMALE', provider: 'test' },
        ];
        expect(() => checkVoiceStructure(bad)).toThrow('No voice');
    });

    it('rejects voice with invalid gender', () => {
        const bad = [
            { language: 'Test', code: 'en-US', translate: 'en', voice: 'v1', voice_alias: 'Test', gender: 'UNKNOWN', provider: 'test' },
        ] as any;
        expect(() => checkVoiceStructure(bad)).toThrow('Invalid gender');
    });
});

describe('TTS Integration — getDefaultVoice', () => {
    it('returns exact code+gender match for Google voices', () => {
        const result = getDefaultVoice(googleHardcodedVoices, 'en-AU-Standard-D', 'FEMALE', 'en-AU');
        expect(result).toBe('en-AU-Standard-A');
    });

    it('falls back to code-only match when gender not found', () => {
        // Danish only has FEMALE, ask for MALE
        const result = getDefaultVoice(googleHardcodedVoices, 'en-AU-Standard-D', 'MALE', 'da-DK');
        expect(result).toBe('da-DK-Standard-A');
    });

    it('falls back to en-US when code not found', () => {
        const result = getDefaultVoice(googleHardcodedVoices, 'en-AU-Standard-D', 'MALE', 'ja-JP');
        expect(result).toBe('en-US-Standard-B');
    });

    it('returns defaultFallback when nothing matches', () => {
        const result = getDefaultVoice([], 'fallback-voice', 'MALE', 'ja-JP');
        expect(result).toBe('fallback-voice');
    });

    it('returns first Amazon voice matching code+gender', () => {
        const result = getDefaultVoice(amazonHardcodedVoices, 'Kimberly', 'FEMALE', 'en-US');
        expect(result).toBe('Kimberly');
    });

    it('returns Tencent fallback for non-matching lang', () => {
        const result = getDefaultVoice(tencentHardcodedVoices, '0', 'FEMALE', 'en-US');
        expect(result).toBe('0');
    });
});

describe('TTS Integration — voice record shapes', () => {
    it('Google voices have provider set to google', () => {
        for (const v of googleHardcodedVoices) {
            expect(v.provider).toBe('google');
        }
    });

    it('Amazon voices have provider set to amazon', () => {
        for (const v of amazonHardcodedVoices) {
            expect(v.provider).toBe('amazon');
        }
    });

    it('Tencent voices have provider set to tencent', () => {
        for (const v of tencentHardcodedVoices) {
            expect(v.provider).toBe('tencent');
        }
    });

    it('Alibaba voices have provider set to alibaba', () => {
        for (const v of alibabaHardcodedVoices) {
            expect(v.provider).toBe('alibaba');
        }
    });

    it('all voice records have translate field of length >= 2', () => {
        const all = [...googleHardcodedVoices, ...amazonHardcodedVoices, ...tencentHardcodedVoices, ...alibabaHardcodedVoices];
        for (const v of all) {
            expect(v.translate.length).toBeGreaterThanOrEqual(2);
        }
    });
});

describe('TTS Integration — getService', () => {
    const providers: Record<string, string> = {
        google: 'GoogleTextToSpeechAPI',
        amazon: 'AmazonTextToSpeechAPI',
        azure: 'AzureTextToSpeechAPI',
    };

    it('returns provider for known name', () => {
        expect(getService(providers, 'google')).toBe('GoogleTextToSpeechAPI');
    });

    it('returns null for unknown provider', () => {
        expect(getService(providers, 'unknown-provider')).toBeNull();
    });

    it('returns null for empty string provider', () => {
        expect(getService(providers, '')).toBeNull();
    });
});

describe('TTS Integration — isValidLang', () => {
    const allVoices = [...googleHardcodedVoices, ...amazonHardcodedVoices];

    it('returns true for en-US', () => {
        expect(isValidLang(allVoices, 'en-US')).toBe(true);
    });

    it('returns true for en-AU', () => {
        expect(isValidLang(allVoices, 'en-AU')).toBe(true);
    });

    it('returns true for fr-FR', () => {
        expect(isValidLang(allVoices, 'fr-FR')).toBe(true);
    });

    it('returns false for non-existent language code', () => {
        expect(isValidLang(allVoices, 'xx-XX')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isValidLang(allVoices, '')).toBe(false);
    });
});

describe('TTS Integration — getVoiceRecords filtering', () => {
    const allVoices = [...googleHardcodedVoices, ...amazonHardcodedVoices];

    it('filters English voices by translate prefix "en"', () => {
        const enVoices = getVoiceRecords(allVoices, 'en');
        expect(enVoices.length).toBeGreaterThan(0);
        for (const v of enVoices) {
            expect(v.translate).toBe('en');
        }
    });

    it('filters French voices by translate prefix "fr"', () => {
        const frVoices = getVoiceRecords(allVoices, 'fr');
        expect(frVoices.length).toBe(1);
        expect(frVoices[0].voice).toBe('fr-FR-Standard-B');
    });

    it('returns empty array for non-existent prefix', () => {
        const result = getVoiceRecords(allVoices, 'zz');
        expect(result).toEqual([]);
    });

    it('filters Danish voices by translate prefix "da"', () => {
        const daVoices = getVoiceRecords(allVoices, 'da');
        expect(daVoices.length).toBe(1);
        expect(daVoices[0].provider).toBe('google');
    });
});
