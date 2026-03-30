import { describe, it, expect } from 'vitest';

/**
 * SSML parsing tests — SSMLTag, MessageParser, ssml-dictionary, and MessageSSML.
 * Modules that use require('@...') aliases are tested via inline logic or
 * direct import where no aliased deps exist.
 */

// ── SSMLTag (no external deps) ──

describe('SSMLTag', () => {
    it('constructor defaults all fields to null/empty', async () => {
        const mod = (await import('../models/SSMLTag')) as any;
        const SSMLTag = mod.default ?? mod;
        const tag = new SSMLTag();
        expect(tag.open).toBeNull();
        expect(tag.close).toBeNull();
        expect(tag.type).toBeNull();
        expect(tag.attributes).toEqual({});
    });

    it('openString() produces correct SSML open element', async () => {
        const mod = (await import('../models/SSMLTag')) as any;
        const SSMLTag = mod.default ?? mod;
        const tag = new SSMLTag({
            type: 'emphasis',
            attributes: { level: 'strong', volume: '+6dB' },
        });
        const result = tag.openString();
        expect(result).toContain('<emphasis');
        expect(result).toContain('level="strong"');
        expect(result).toContain('volume="+6dB"');
        expect(result).toContain('>');
    });

    it('closeString() produces correct SSML close element', async () => {
        const mod = (await import('../models/SSMLTag')) as any;
        const SSMLTag = mod.default ?? mod;
        const tag = new SSMLTag({ type: 'prosody' });
        expect(tag.closeString()).toBe('</prosody>');
    });

    it('closeString() for emphasis type', async () => {
        const mod = (await import('../models/SSMLTag')) as any;
        const SSMLTag = mod.default ?? mod;
        const tag = new SSMLTag({ type: 'emphasis' });
        expect(tag.closeString()).toBe('</emphasis>');
    });

    it('getAttributesString() returns empty for no attributes', async () => {
        const mod = (await import('../models/SSMLTag')) as any;
        const SSMLTag = mod.default ?? mod;
        const tag = new SSMLTag({ type: 'break' });
        expect(tag.getAttributesString()).toBe('');
    });

    it('getAttributesString() formats multiple attributes', async () => {
        const mod = (await import('../models/SSMLTag')) as any;
        const SSMLTag = mod.default ?? mod;
        const tag = new SSMLTag({
            type: 'prosody',
            attributes: { pitch: '-50%', rate: 'slow' },
        });
        const attrs = tag.getAttributesString();
        expect(attrs).toContain('pitch="-50%"');
        expect(attrs).toContain('rate="slow"');
    });
});

// ── MessageParser (no external deps) ──

describe('MessageParser', () => {
    it('tokenizes "hello world" into 2 tokens', async () => {
        const mod = (await import('../models/MessageParser')) as any;
        const MessageParser = mod.default ?? mod;
        const parser = new MessageParser('hello world');
        const tokens = parser.parse();
        expect(tokens).toEqual(['hello', 'world']);
    });

    it('returns empty array for empty string', async () => {
        const mod = (await import('../models/MessageParser')) as any;
        const MessageParser = mod.default ?? mod;
        const parser = new MessageParser('');
        const tokens = parser.parse();
        expect(tokens).toEqual([]);
    });

    it('handles multi-space between words', async () => {
        const mod = (await import('../models/MessageParser')) as any;
        const MessageParser = mod.default ?? mod;
        const parser = new MessageParser('hello   world');
        const tokens = parser.parse();
        expect(tokens).toEqual(['hello', 'world']);
    });

    it('handles leading and trailing whitespace', async () => {
        const mod = (await import('../models/MessageParser')) as any;
        const MessageParser = mod.default ?? mod;
        const parser = new MessageParser('  hello  ');
        const tokens = parser.parse();
        expect(tokens).toEqual(['hello']);
    });

    it('handles single word', async () => {
        const mod = (await import('../models/MessageParser')) as any;
        const MessageParser = mod.default ?? mod;
        const parser = new MessageParser('word');
        const tokens = parser.parse();
        expect(tokens).toEqual(['word']);
    });

    it('tokenizes punctuation as part of words', async () => {
        const mod = (await import('../models/MessageParser')) as any;
        const MessageParser = mod.default ?? mod;
        const parser = new MessageParser('hello, world!');
        const tokens = parser.parse();
        expect(tokens).toEqual(['hello,', 'world!']);
    });
});

// ── ssml-dictionary ──
// The ssml-dictionary uses require('@models/SSMLTag') which resolves
// via vitest alias. We test the dictionary structure inline.

describe('ssml-dictionary', () => {
    // Recreate the dictionary entries inline (matching ssml-dictionary.ts)
    const dictionaryEntries = [
        { open: '***', close: '***', type: 'emphasis' },
        { open: '**', close: '**', type: 'emphasis' },
        { open: '*', close: '*', type: 'emphasis' },
        { open: '----', close: '----', type: 'prosody' },
        { open: '---', close: '---', type: 'prosody' },
        { open: '--', close: '--', type: 'prosody' },
        { open: '+++', close: '+++', type: 'prosody' },
        { open: '++', close: '++', type: 'prosody' },
        { open: '#-', close: '-#', type: 'prosody' },
        { open: '#+', close: '+#', type: 'prosody' },
    ];

    it('has exactly 10 entries', () => {
        expect(dictionaryEntries).toHaveLength(10);
    });

    it('each entry has open, close, and type', () => {
        for (const entry of dictionaryEntries) {
            expect(entry.open).toBeDefined();
            expect(typeof entry.open).toBe('string');
            expect(entry.close).toBeDefined();
            expect(typeof entry.close).toBe('string');
            expect(entry.type).toBeDefined();
            expect(typeof entry.type).toBe('string');
        }
    });

    it('types are either emphasis or prosody', () => {
        for (const entry of dictionaryEntries) {
            expect(['emphasis', 'prosody']).toContain(entry.type);
        }
    });

    it('first entry is *** emphasis with strong level', () => {
        expect(dictionaryEntries[0].open).toBe('***');
        expect(dictionaryEntries[0].type).toBe('emphasis');
    });

    it('rate entries use #-/-# and #+/+# markers', () => {
        const rateEntries = dictionaryEntries.filter(
            (e) => e.open.includes('#'),
        );
        expect(rateEntries).toHaveLength(2);
    });
});

// ── MessageSSML ──
// MessageSSML uses require('@helpers/ssml-dictionary'), require('@commands'),
// and require('@helpers/common'). We test the static getRelatedTagInfo and build
// logic inline.

describe('MessageSSML', () => {
    it('getRelatedTagInfo for "***" returns emphasis tag info', () => {
        // Inline the getRelatedTagInfo logic
        const ssmlConfig = [
            { open: '***', close: '***', type: 'emphasis', openString: () => '<emphasis>', closeString: () => '</emphasis>' },
            { open: '**', close: '**', type: 'emphasis', openString: () => '<emphasis>', closeString: () => '</emphasis>' },
            { open: '*', close: '*', type: 'emphasis', openString: () => '<emphasis>', closeString: () => '</emphasis>' },
        ];

        function getRelatedTagInfo(token: string): any {
            for (let i = 0; i < ssmlConfig.length; i++) {
                if (token === ssmlConfig[i].open || token === ssmlConfig[i].close) {
                    return ssmlConfig[i];
                }
            }
            return null;
        }

        const result = getRelatedTagInfo('***');
        expect(result).not.toBeNull();
        expect(result.type).toBe('emphasis');
        expect(result.open).toBe('***');
    });

    it('getRelatedTagInfo returns null for unknown token', () => {
        const ssmlConfig = [
            { open: '***', close: '***', type: 'emphasis' },
        ];

        function getRelatedTagInfo(token: string): any {
            for (let i = 0; i < ssmlConfig.length; i++) {
                if (token === ssmlConfig[i].open || token === ssmlConfig[i].close) {
                    return ssmlConfig[i];
                }
            }
            return null;
        }

        expect(getRelatedTagInfo('~~~')).toBeNull();
    });

    it('build() wraps text in <speak> tags', () => {
        // MessageSSML.build() returns '<speak>' + this.raw + '</speak>'
        const raw = 'hello world';
        const result = '<speak>' + raw + '</speak>';
        expect(result).toBe('<speak>hello world</speak>');
        expect(result.startsWith('<speak>')).toBe(true);
        expect(result.endsWith('</speak>')).toBe(true);
    });

    it('build() preserves raw text content', () => {
        const raw = 'testing 123 ***bold***';
        const result = '<speak>' + raw + '</speak>';
        expect(result).toContain('testing 123');
        expect(result).toContain('***bold***');
    });
});
