import { describe, it, expect } from 'vitest';
import path from 'path';
import type { ServerStateData } from '../types';

/**
 * Server config tests — ServerStateData shape, textrules, lang messages,
 * save replacer logic, and state round-trip serialization.
 */

const CONFIG_DIR = path.resolve(__dirname, '../../config');
const SRC_DIR = path.resolve(__dirname, '..');

describe('ServerStateData shape', () => {
    const sampleState: ServerStateData = {
        server_id: '123456789',
        server_name: 'Test Server',
        audioEmojis: { ':wave:': 'https://example.com/wave.mp3' },
        memberSettings: {
            '111': { name: 'en-AU-Standard-A', voice_provider: 'google' },
        },
        textrules: { 'o\\/': 'wave' },
        permitted: { '111': true },
        defaultProvider: 'google',
        language: 'en-AU',
        adminrole: '',
        restrictions: [],
        bind: [],
        bindPermit: false,
        keepMessages: {},
        stats: { characterCount: 500 },
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-06-15T12:00:00.000Z',
        charLimit: 100000,
        fallbackLang: 'en',
        messages: {},
    };

    it('has all required string fields', () => {
        expect(typeof sampleState.server_id).toBe('string');
        expect(typeof sampleState.server_name).toBe('string');
        expect(typeof sampleState.defaultProvider).toBe('string');
        expect(typeof sampleState.language).toBe('string');
        expect(typeof sampleState.adminrole).toBe('string');
        expect(typeof sampleState.fallbackLang).toBe('string');
    });

    it('has all required object/array fields', () => {
        expect(typeof sampleState.audioEmojis).toBe('object');
        expect(typeof sampleState.memberSettings).toBe('object');
        expect(typeof sampleState.textrules).toBe('object');
        expect(typeof sampleState.permitted).toBe('object');
        expect(Array.isArray(sampleState.restrictions)).toBe(true);
        expect(Array.isArray(sampleState.bind)).toBe(true);
        expect(typeof sampleState.keepMessages).toBe('object');
        expect(typeof sampleState.stats).toBe('object');
        expect(typeof sampleState.messages).toBe('object');
    });

    it('has correct primitive types for boolean/number fields', () => {
        expect(typeof sampleState.bindPermit).toBe('boolean');
        expect(typeof sampleState.charLimit).toBe('number');
    });

    it('created and updated are ISO date strings', () => {
        expect(sampleState.created).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(sampleState.updated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('memberSettings entries have voice config keys', () => {
        const member = sampleState.memberSettings['111'];
        expect(member).toBeDefined();
        expect(member.name).toBe('en-AU-Standard-A');
        expect(member.voice_provider).toBe('google');
    });
});

describe('default textrules', () => {
    it('loads default textrules from config/default.textrules.json', () => {
        const textrules = require(path.join(CONFIG_DIR, 'default.textrules.json'));
        expect(textrules).toBeDefined();
        expect(typeof textrules).toBe('object');
    });

    it('has at least 3 text rule entries', () => {
        const textrules = require(path.join(CONFIG_DIR, 'default.textrules.json'));
        const keys = Object.keys(textrules);
        expect(keys.length).toBeGreaterThanOrEqual(3);
    });

    it('contains the wave rule', () => {
        const textrules = require(path.join(CONFIG_DIR, 'default.textrules.json'));
        expect(textrules['o\\/']).toBe('wave');
    });

    it('all values are strings', () => {
        const textrules = require(path.join(CONFIG_DIR, 'default.textrules.json'));
        for (const key of Object.keys(textrules)) {
            expect(typeof textrules[key]).toBe('string');
        }
    });
});

describe('lang messages', () => {
    it('loads lang messages from src/lang.json', () => {
        const lang = require(path.join(SRC_DIR, 'lang.json'));
        expect(lang).toBeDefined();
        expect(typeof lang).toBe('object');
    });

    it('has en.ping section', () => {
        const lang = require(path.join(SRC_DIR, 'lang.json'));
        expect(lang['en.ping']).toBeDefined();
        expect(lang['en.ping'].okay).toBe('pong');
    });

    it('has en.general section', () => {
        const lang = require(path.join(SRC_DIR, 'lang.json'));
        expect(lang['en.general']).toBeDefined();
        expect(typeof lang['en.general'].auto).toBe('string');
    });
});

describe('Server save replacer', () => {
    // Extracted from Server.save() — the replacer function
    function replacer(key: string, value: any): any {
        if (key.endsWith('_timeout')) return undefined;
        if (key === 'commandResponses') return undefined;
        if (key === 'bound_to') return undefined;
        if (key === 'world') return undefined;
        if (key === 'guild') return undefined;
        if (key === 'keepQueue') return undefined;
        if (key === 'switchQueue') return undefined;
        if (key === 'twitch') return undefined;
        if (key === 'connection') return undefined;
        if (key === 'player') return undefined;
        else return value;
    }

    it('excludes _timeout fields', () => {
        expect(replacer('neglect_timeout', 12345)).toBeUndefined();
        expect(replacer('voice_timeout', 99999)).toBeUndefined();
    });

    it('excludes commandResponses', () => {
        expect(replacer('commandResponses', {})).toBeUndefined();
    });

    it('excludes bound_to', () => {
        expect(replacer('bound_to', { id: '123' })).toBeUndefined();
    });

    it('excludes world', () => {
        expect(replacer('world', { servers: {} })).toBeUndefined();
    });

    it('excludes guild', () => {
        expect(replacer('guild', { id: '123', name: 'test' })).toBeUndefined();
    });

    it('excludes player', () => {
        expect(replacer('player', {})).toBeUndefined();
    });

    it('excludes connection', () => {
        expect(replacer('connection', {})).toBeUndefined();
    });

    it('excludes keepQueue and switchQueue', () => {
        expect(replacer('keepQueue', [])).toBeUndefined();
        expect(replacer('switchQueue', [])).toBeUndefined();
    });

    it('excludes twitch', () => {
        expect(replacer('twitch', {})).toBeUndefined();
    });

    it('preserves normal fields', () => {
        expect(replacer('server_id', '123')).toBe('123');
        expect(replacer('language', 'en-AU')).toBe('en-AU');
        expect(replacer('charLimit', 100000)).toBe(100000);
        expect(replacer('audioEmojis', {})).toEqual({});
    });
});

describe('state round-trip', () => {
    function replacer(key: string, value: any): any {
        if (key.endsWith('_timeout')) return undefined;
        if (key === 'commandResponses') return undefined;
        if (key === 'bound_to') return undefined;
        if (key === 'world') return undefined;
        if (key === 'guild') return undefined;
        if (key === 'keepQueue') return undefined;
        if (key === 'switchQueue') return undefined;
        if (key === 'twitch') return undefined;
        if (key === 'connection') return undefined;
        if (key === 'player') return undefined;
        else return value;
    }

    it('serialize and parse preserves data fields', () => {
        const state: ServerStateData & { neglect_timeout?: number; world?: any; guild?: any; player?: any } = {
            server_id: '999',
            server_name: 'Round Trip Server',
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
            stats: { characterCount: 42 },
            created: '2024-01-01T00:00:00.000Z',
            updated: '2024-06-15T12:00:00.000Z',
            charLimit: 100000,
            fallbackLang: 'en',
            messages: {},
            // Runtime fields that should be excluded
            neglect_timeout: 99999,
            world: { servers: {} },
            guild: { id: '999', name: 'test' },
            player: { stop: () => {} },
        };

        const json = JSON.stringify(state, replacer);
        const parsed = JSON.parse(json);

        expect(parsed.server_id).toBe('999');
        expect(parsed.server_name).toBe('Round Trip Server');
        expect(parsed.language).toBe('en-AU');
        expect(parsed.charLimit).toBe(100000);
        expect(parsed.stats.characterCount).toBe(42);
    });

    it('runtime fields are excluded after round-trip', () => {
        const state = {
            server_id: '999',
            neglect_timeout: 12345,
            world: {},
            guild: {},
            player: {},
            bound_to: { id: '111' },
            connection: {},
            commandResponses: {},
        };

        const json = JSON.stringify(state, replacer);
        const parsed = JSON.parse(json);

        expect(parsed.neglect_timeout).toBeUndefined();
        expect(parsed.world).toBeUndefined();
        expect(parsed.guild).toBeUndefined();
        expect(parsed.player).toBeUndefined();
        expect(parsed.bound_to).toBeUndefined();
        expect(parsed.connection).toBeUndefined();
        expect(parsed.commandResponses).toBeUndefined();
    });
});
