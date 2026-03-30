# Feature: Phase 2 — Core Types & Models

## Summary

Define all TypeScript interfaces and types that form the foundation for the TalkBot codebase. This includes: interfaces for auth config, server state (`.server` files), TTS voice records, member settings, command contracts, listener system payloads, and all model classes. These types will be imported by every subsequent phase. No behavioral changes — only type definitions in new `.ts` files alongside the existing `.js` files.

## User Story

As a developer converting TalkBot to TypeScript
I want comprehensive type definitions for all config, state, and model contracts
So that subsequent conversion phases have accurate types to import and all `.server` files can be validated

## Problem Statement

The codebase has zero type definitions. Config shapes are implicit in JSON files, model contracts are inferred from usage patterns, and two incompatible command patterns coexist. TypeScript conversion cannot proceed without explicit interfaces for every data shape flowing through the system.

## Solution Statement

Create a `src/types/` directory with interface files organized by domain. Define types from actual codebase usage (traced by codebase-analyst), not just from example config files. Keep existing `.js` files untouched — this phase only adds new `.ts` type definition files.

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR |
| Complexity | HIGH |
| Systems Affected | types (new), models, services, commands, config |
| Dependencies | zod ^3.23.0, discord.js ^14.25.1, @discordjs/voice ^0.19.0 |
| Estimated Tasks | 8 |

---

## UX Design

### Before State

```
╔══════════════════════════════════════════════════════════════════╗
║  No types exist. All shapes are implicit:                       ║
║                                                                  ║
║  config/auth.json → require('@auth') → untyped object           ║
║  config/*.server  → JSON.parse()     → untyped object           ║
║  Server.memberSettings[id]           → any                      ║
║  TextToSpeechService.buildRequest()  → any                      ║
║  command.execute(msgDets)            → void (untyped arg)       ║
║  commands.notify('token', args)      → any (untyped payload)    ║
║                                                                  ║
║  PAIN: No IDE autocomplete, no compile-time error detection,    ║
║        two command patterns with different call signatures       ║
╚══════════════════════════════════════════════════════════════════╝
```

### After State

```
╔══════════════════════════════════════════════════════════════════╗
║  All shapes explicitly typed in src/types/:                     ║
║                                                                  ║
║  AuthConfig        → typed config/auth.json shape               ║
║  ServerStateData   → typed .server file shape                   ║
║  MemberSettings    → typed per-user settings                    ║
║  VoiceRecord       → typed TTS voice objects                    ║
║  CommandContract   → unified command interface                  ║
║  ListenerPayloads  → typed event args per listener type         ║
║  All model classes → typed properties and methods               ║
║                                                                  ║
║  VALUE: IDE autocomplete everywhere, catch type errors at       ║
║         compile time, clear contracts between components        ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Mandatory Reading

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/models/Server.js` | 25-120 | All Server properties and their defaults |
| P0 | `src/models/Server.js` | 423-450 | save() replacer — what goes to disk |
| P0 | `src/models/Server.js` | 457-499 | talk() — voice settings shape |
| P0 | `src/services/TextToSpeechService.js` | 1-200 | Base class contract, voice structure checks |
| P0 | `src/models/Command.js` | 1-85 | Command base class — all getters and listeners |
| P0 | `src/models/BotCommand.js` | 1-35 | Legacy command pattern |
| P0 | `src/commands/index.js` | 1-230 | Commands registry, listener system, process() |
| P0 | `src/models/MessageDetails.js` | 1-95 | MessageDetails — all methods and properties |
| P1 | `config/auth.example.json` | all | Auth config template |
| P1 | `src/models/World.js` | 1-60 | World singleton properties |
| P1 | `src/models/CommentBuilder.js` | 1-100 | CommentBuilder data shape |
| P1 | `src/models/MessageSSML.js` | 1-100 | SSML builder |
| P1 | `src/models/MessageParser.js` | 1-50 | Parser |
| P1 | `src/models/SSMLTag.js` | 1-30 | SSMLTag properties |
| P2 | `src/helpers/common.js` | all | Common static utility methods |
| P2 | `src/helpers/bot-stuff.js` | all | BotStuff singleton exports |

---

## Patterns to Mirror

**EXISTING TEST PATTERN:**

```typescript
// SOURCE: src/env.test.ts:1-6
// COPY THIS PATTERN for type validation tests:
import { describe, it, expect } from 'vitest';

describe('env', () => {
    it('should export env with required fields when valid .env exists', async () => {
        const { env } = await import('./env');
        expect(env).toBeDefined();
    });
});
```

**EXISTING TYPESCRIPT PATTERN:**

```typescript
// SOURCE: src/env.ts:1-3
// COPY THIS IMPORT STYLE:
import 'dotenv/config';
import { z } from 'zod';
```

**PRETTIER FORMATTING** — all files: 4-space indent, single quotes, trailing commas, semicolons, 110 char width.

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/types/config.ts` | CREATE | AuthConfig, TTS provider config, server override types |
| `src/types/server-state.ts` | CREATE | ServerStateData interface matching .server file shape |
| `src/types/member-settings.ts` | CREATE | MemberSettings, VoiceSettings interfaces |
| `src/types/tts.ts` | CREATE | VoiceRecord, TTS provider contract, audio content types |
| `src/types/commands.ts` | CREATE | Command interfaces, listener types, event payloads |
| `src/types/models.ts` | CREATE | MessageDetails, CommentBuilder, SSML types |
| `src/types/index.ts` | CREATE | Re-export all types from single entry point |
| `src/types/types.test.ts` | CREATE | Type compilation and shape validation tests |

---

## NOT Building (Scope Limits)

- **NOT converting any `.js` files to `.ts`** — only creating new type definition files
- **NOT changing any runtime behavior** — types are compile-time only
- **NOT creating Zod runtime validators for config** — types only (runtime validation comes later)
- **NOT merging the two command patterns** — define interfaces for BOTH `BotCommand` and `Command`; unification happens in Phase 5

---

## Step-by-Step Tasks

### Task 1: CREATE `src/types/config.ts`

- **ACTION**: Define all configuration-related interfaces
- **IMPLEMENT**:

```typescript
/** Shape of config/auth.json */
export interface AuthConfig {
    dev_ids: string[];
    token: string;
    neglect_timeout: number;
    neglect_timeout_messages: string[];
    command_char: string;
    logging: { err: boolean; out: boolean };
    advertise_streamer: string;
    supportServer: { id: string };
    pester_threshold: number;
    twitch_audioQueue_limit: number;
    default_title?: string;
    servers: Record<string, ServerOverride>;
    tts: TTSConfig;
}

export interface ServerOverride {
    pester_threshold?: number;
    daily_char_limit?: number;
    twitch_audioQueue_limit?: number;
}

export interface TTSConfig {
    google?: TTSProviderConfig & { enforce_limit: boolean; limit: number };
    azure?: TTSProviderConfig & {
        subscriptionKey: string;
        endpoint: string;
        enforce_limit: boolean;
        limit: number;
    };
    amazon?: TTSProviderConfig & {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        enforce_limit: boolean;
        limit: number;
    };
    watson?: TTSProviderConfig & {
        apikey: string;
        serviceUrl: string;
        enforce_limit: boolean;
        limit: number;
    };
    tencent?: TTSProviderConfig & {
        accessKeyId: string;
        secretAccessKey: string;
        enforce_limit: boolean;
        limit: number;
    };
    alibaba?: TTSProviderConfig & {
        appkey: string;
        token: string;
        endpoint: string;
        enforce_limit: boolean;
        limit: number;
    };
}

export interface TTSProviderConfig {
    enabled: boolean;
}

/** Shape of config/default.textrules.json — regex string keys to replacement strings */
export type TextRules = Record<string, string>;

/**
 * Shape of src/lang.json and config/lang.json
 * Nested: locale → command → key → template string with :param interpolations
 */
export type LangMessages = Record<string, Record<string, string>>;

/** Shape of the paths.js module export */
export interface Paths {
    state: string;
    auth: string;
    config: string;
    src: string;
    helpers: string;
    commands: string;
    models: string;
    services: string;
    tts: string;
    join(a: string, b: string): string;
    resolve(a: string, b: string): string;
    require(aliased_path: string): unknown;
}
```

- **GOTCHA**: `servers` in AuthConfig is keyed by guild snowflake string OR `"-1"` for global defaults.
- **GOTCHA**: All TTS provider sub-configs are optional — not every installation enables every provider.
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE `src/types/member-settings.ts`

- **ACTION**: Define member settings and voice settings interfaces
- **IMPLEMENT**:

```typescript
/**
 * Per-user settings stored in Server.memberSettings[userId].
 * Written via Server.addMemberSetting(), read via Server.getMemberSetting().
 */
export interface MemberSettings {
    name?: string;                          // TTS voice ID
    alias?: string;                         // voice_alias (human-readable)
    voice_provider?: string;                // provider shortname
    pitch?: number;                         // prosody pitch (Google: float)
    speed?: number;                         // prosody rate (Google: float)
    gender?: string;                        // 'MALE' | 'FEMALE' | 'NEUTRAL'
    language?: string;                      // human-readable language name
    code?: string;                          // BCP-47 language code
    toLanguage?: string;                    // translation target ('default' to reset)
    muted?: boolean;
    mytitle?: string;
    announceme?: 'on' | 'off';
    myprefix?: string;
    mysuffix?: string;
    'amazon-xml-encode-disabled'?: boolean;
    'amazon-breaths-disabled'?: boolean;
    [key: string]: unknown;                 // allow extension by command modules
}

/**
 * Voice settings assembled at Server.talk() from member settings.
 * Passed to TextToSpeechService.buildRequest().
 */
export interface VoiceSettings {
    name?: string;
    pitch?: number;
    speed?: number;
    voice_provider?: string;
    language?: string;
    gender?: string;
    code?: string;
    'amazon-xml-encode-disabled'?: boolean;
    'amazon-breaths-disabled'?: boolean;
}
```

- **GOTCHA**: `MemberSettings` has an index signature `[key: string]: unknown` because command modules can add arbitrary keys via `addMemberSetting()`.
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE `src/types/server-state.ts`

- **ACTION**: Define the `.server` file shape and runtime Server properties
- **IMPLEMENT**:

```typescript
import type { MemberSettings } from './member-settings';

/**
 * Shape of config/<guild_id>.server JSON files.
 * This is what Server.save() serializes and Server.loadState() reads.
 * The save() replacer excludes: *_timeout keys, commandResponses,
 * bound_to, world, guild, keepQueue, switchQueue, twitch, connection, player.
 */
export interface ServerStateData {
    server_id: string;
    server_name: string;
    audioEmojis: Record<string, string>;
    memberSettings: Record<string, MemberSettings>;
    textrules: Record<string, string>;
    permitted: Record<string, boolean>;
    defaultProvider: string;
    language: string;
    adminrole: string;
    restrictions: string[];
    bind: string[];
    bindPermit: boolean;
    keepMessages: Record<string, unknown>;
    stats: ServerStats;
    created: string;                        // ISO date string in JSON
    command_char?: string;
    updated: string;                        // ISO date string in JSON
    charLimit: number;
    fallbackLang: string;
    messages: Record<string, string>;
    // Runtime-only fields that may appear in saved state
    connecting?: boolean;
    playing?: boolean;
    leaving?: boolean;
    dailyStats?: DailyStatEntry[];
}

export interface ServerStats {
    characterCount?: number;
    wordCount?: number;
    uniqueUsers?: Record<string, true>;
}

export interface DailyStatEntry {
    key: string;
    characterCount: number;
    wordCount: number;
    uniqueUsers: Record<string, true>;
}
```

- **GOTCHA**: `created` and `updated` are `Date` at runtime but serialize as ISO strings in `.server` files.
- **GOTCHA**: `connecting`, `playing`, `leaving` are runtime-only but can leak into saved state — define them as optional.
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: CREATE `src/types/tts.ts`

- **ACTION**: Define TTS provider contract and voice record types
- **IMPLEMENT**:

```typescript
import type { Readable } from 'stream';
import type { VoiceSettings } from './member-settings';

/**
 * A voice record as returned by TTS providers.
 * Shape enforced by TextToSpeechService.checkVoiceStructure().
 */
export interface VoiceRecord {
    voice: string;              // provider-native voice ID (e.g. 'en-AU-Standard-A')
    voice_alias: string;        // human-readable alias (e.g. 'Mia')
    gender: 'MALE' | 'FEMALE';
    provider: string;           // must match provider.shortname
    language: string;           // human-readable language name
    code: string;               // BCP-47 code (e.g. 'en-AU')
    translate: string;          // ISO-639-1 two-letter code (e.g. 'en')
    type?: string;              // Google-only: 'Standard' | 'WaveNet' | 'Wavenet'
    codes?: string[];           // Google-only: multiple language codes
    description?: string;       // Watson-only
}

/**
 * Audio content returned by getAudioContent().
 * Either a Readable stream directly or an async factory function.
 */
export type AudioContent = Readable | (() => Promise<Readable>);

/**
 * Audio format strings used across TTS providers.
 */
export type AudioFormat = 'ogg' | 'ogg/opus' | 'opus' | 'mp3' | 'pcm' | 'ogg_vorbis';

/**
 * Contract that all TTS provider classes must implement.
 * Base class: src/services/TextToSpeechService.js
 */
export interface TTSProviderContract {
    /** Provider identifier (e.g. 'google', 'amazon', 'azure') */
    readonly shortname: string;
    /** Whether this provider is enabled in config */
    readonly enabled: boolean;
    /** Character limit for this provider */
    readonly limit: number;
    /** Audio output format */
    readonly format: AudioFormat;

    /** Run startup validation — may call process.exit() on failure */
    startupTests(): Promise<void>;
    /** Build an API request from message text and voice settings */
    buildRequest(message: string, settings: VoiceSettings, server: unknown): unknown;
    /** Execute the API request and return audio content via callback */
    getAudioContent(
        request: unknown,
        callback: (err: Error | null, audio: AudioContent | null) => void,
    ): void;
    /** Get all available voices for this provider */
    getVoices(): VoiceRecord[];
    /** Get the default voice for a gender and language */
    getDefaultVoice(gender: string, lang_code: string): string;
    /** Get a deterministic random voice based on seed */
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

/**
 * PollyTTS textToSpeech options.
 */
export interface PollyTTSOptions {
    text: string;
    textType?: string;
    voiceId?: string;
    sampleRate?: number;
    outputFormat?: string;
    region?: string;
}
```

- **GOTCHA**: `buildRequest` return type is `unknown` because each provider returns a different request shape (Google: object, Azure: XML string, Amazon: options object).
- **GOTCHA**: `server` parameter in `buildRequest` is typed as `unknown` for now — will be typed as `Server` once models are converted.
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: CREATE `src/types/commands.ts`

- **ACTION**: Define command interfaces, listener types, and event payloads
- **IMPLEMENT**:

```typescript
import type { Message, GuildMember, VoiceState, Collection, Role } from 'discord.js';

/**
 * Listener callback function signature.
 * Receives an args object and may return a modified value.
 */
export type ListenerCallback = (args: ListenerArgs) => unknown;

/**
 * Base args shape passed to all listener callbacks.
 * Each listener type extends this with specific fields.
 */
export interface ListenerArgs {
    server: unknown;                    // Server instance (typed as unknown until Phase 2 model conversion)
    modified?: unknown;                 // last non-null return from prior listener in chain
    command?: unknown;                  // the BotCommand/Command that registered this listener
    [key: string]: unknown;
}

/** Listener entry stored in the Commands registry */
export interface ListenerEntry {
    cb: ListenerCallback;
    sequence: number;
    command: CommandLike;
}

/** All listener event type names */
export type ListenerType =
    | 'token'
    | 'message'
    | 'validate'
    | 'preValidate'
    | 'messageDelivered'
    | 'joinVoice'
    | 'leaveVoice'
    | 'follow'
    | 'unfollow'
    | 'configureVoice'
    | 'userJoinedChannel'
    | 'configureSettings';

/**
 * Map of listener event names to arrays of registered listeners.
 */
export type ListenerMap = Record<ListenerType, ListenerEntry[]>;

/**
 * Listener map as defined on a command (event name → handler function or null).
 */
export type CommandListeners = Partial<Record<ListenerType, ListenerCallback | null>>;

/**
 * Unified interface for both BotCommand and Command patterns.
 * Used by the Commands registry to treat both interchangeably.
 */
export interface CommandLike {
    command_name: string;
    command_arg?: string | null;
    short_help: string | null;
    long_help: string | null;
    hidden: boolean;
    order: number;
    group?: string;
    listeners?: CommandListeners | Record<string, ListenerCallback>;
    sequence?: { message?: number; token?: number };
    startup?: (() => void) | null;
    execute(...args: unknown[]): void;
}

/**
 * Data object passed to BotCommand constructor.
 */
export interface BotCommandData {
    command_name: string;
    command_arg?: string;
    execute: (...args: unknown[]) => void;
    short_help?: string;
    long_help?: string;
    group?: string;
    hidden?: boolean;
    order?: number;
    startup?: () => void;
    listeners?: Partial<Record<string, ListenerCallback>>;
    sequence?: { message?: number; token?: number };
}

/**
 * Shape of the data object passed to command.execute() for Command subclasses.
 * Note: BotCommand.execute receives MessageDetails directly, not wrapped.
 */
export interface CommandExecuteArgs {
    input: MessageDetailsLike;
}

/**
 * Minimal MessageDetails shape for typing purposes.
 * Full implementation typed in models.ts.
 */
export interface MessageDetailsLike {
    world: unknown;
    server: unknown;
    args: string[] | null;
    message: Message | null;
    content: string;
    cmdChar?: string;
    cmd?: string;
    response(message: string, params?: unknown): void;
    richResponse(embobj: object): void;
    il8nResponse(key: string, params?: Record<string, unknown>): void;
    ownerIsMaster(): boolean;
    ownerIsDev(): boolean;
    ownerIsPermitted(): boolean;
    ownerCanManageTheServer(): boolean;
    memberCanManageTheBot(): boolean;
    getNonSnowflakeRoles(): Collection<string, Role>;
    getDisplayNamesAsCSV(): string;
}

/**
 * Command module export contract.
 * Every file in src/commands/modules/ must export these functions.
 */
export interface CommandModule {
    register(commands: unknown): void;
    unRegister(commands: unknown): void;
}
```

- **GOTCHA**: `BotCommand.execute` receives `MessageDetails` directly; `Command.execute` receives `{ input: MessageDetails }`. The `CommandLike` interface uses `...args: unknown[]` to accommodate both patterns.
- **GOTCHA**: `ListenerArgs` uses an index signature to allow event-specific fields.
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: CREATE `src/types/models.ts`

- **ACTION**: Define CommentBuilder, SSMLTag, MessageParser, MessageSSML types
- **IMPLEMENT**:

```typescript
/**
 * Data passed to CommentBuilder constructor.
 */
export interface CommentBuilderData {
    padding?: string;
    formatKey?: boolean;
    data?: Record<string, unknown> | unknown[] | string;
    keyMap?: Record<string, string>;
}

/**
 * SSMLTag properties — maps Discord markdown tokens to SSML elements.
 */
export interface SSMLTagData {
    open: string | null;
    close: string | null;
    type: string | null;
    attributes: Record<string, string>;
}

/**
 * Discord-to-SSML tag dictionary entry.
 * Used by ssml-dictionary.js.
 */
export interface SSMLDictionaryEntry extends SSMLTagData {
    openString(): string;
    closeString(): string;
    getAttributesString(): string;
}

/**
 * Options passed to MessageSSML constructor.
 */
export interface MessageSSMLOptions {
    server: unknown;    // Server instance
}
```

- **VALIDATE**: `npx tsc --noEmit`

### Task 7: CREATE `src/types/index.ts`

- **ACTION**: Re-export all types from a single entry point
- **IMPLEMENT**:

```typescript
// Configuration types
export type {
    AuthConfig,
    ServerOverride,
    TTSConfig,
    TTSProviderConfig,
    TextRules,
    LangMessages,
    Paths,
} from './config';

// Member settings
export type { MemberSettings, VoiceSettings } from './member-settings';

// Server state
export type { ServerStateData, ServerStats, DailyStatEntry } from './server-state';

// TTS provider types
export type {
    VoiceRecord,
    AudioContent,
    AudioFormat,
    TTSProviderContract,
    AWSPollyVoice,
    PollyTTSOptions,
} from './tts';

// Command system types
export type {
    ListenerCallback,
    ListenerArgs,
    ListenerEntry,
    ListenerType,
    ListenerMap,
    CommandListeners,
    CommandLike,
    BotCommandData,
    CommandExecuteArgs,
    MessageDetailsLike,
    CommandModule,
} from './commands';

// Model types
export type {
    CommentBuilderData,
    SSMLTagData,
    SSMLDictionaryEntry,
    MessageSSMLOptions,
} from './models';
```

- **VALIDATE**: `npx tsc --noEmit`

### Task 8: CREATE `src/types/types.test.ts`

- **ACTION**: Write tests validating type definitions compile correctly and match real data shapes
- **IMPLEMENT**: Tests that import the types and verify they compile against representative data shapes from the actual codebase. Include shape assertions for auth.example.json and default.textrules.json.

```typescript
import { describe, it, expect } from 'vitest';
import type {
    AuthConfig,
    ServerStateData,
    MemberSettings,
    VoiceRecord,
    CommandLike,
    ListenerType,
    CommentBuilderData,
    SSMLTagData,
    TextRules,
    VoiceSettings,
    AudioFormat,
} from './index';

describe('types', () => {
    it('AuthConfig matches auth.example.json shape', () => {
        // Compile-time check — if this compiles, the type matches
        const config: AuthConfig = {
            dev_ids: ['279935071165743105'],
            token: 'test',
            neglect_timeout: 3600000,
            neglect_timeout_messages: ['timeout'],
            command_char: '!',
            logging: { err: true, out: true },
            advertise_streamer: 'test',
            supportServer: { id: '490087447758241793' },
            pester_threshold: 100000,
            twitch_audioQueue_limit: 10,
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
        expect(config.token).toBe('test');
        expect(config.tts.google?.enabled).toBe(true);
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

    it('MemberSettings accepts all known keys', () => {
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
        };
        expect(settings.name).toBe('en-AU-Standard-A');
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

    it('ListenerType covers all event types', () => {
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
```

- **VALIDATE**: `npm test`

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `src/types/types.test.ts` | 10 tests covering all major type shapes | Types compile against representative data |

### Edge Cases Checklist

- [ ] AuthConfig with all optional TTS providers absent
- [ ] ServerStateData with empty memberSettings
- [ ] MemberSettings with arbitrary extension keys
- [ ] VoiceRecord without optional Google/Watson fields
- [ ] CommandLike with both BotCommand and Command shapes

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npx tsc --noEmit
```

**EXPECT**: Exit 0, no type errors

### Level 2: UNIT_TESTS

```bash
npm test
```

**EXPECT**: All tests pass (existing env tests + new type tests)

### Level 3: FULL_SUITE

```bash
npm test && npm run build
```

**EXPECT**: All tests pass, build succeeds, type files compiled to dist/

---

## Acceptance Criteria

- [ ] All type files exist in `src/types/`
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All 10+ type tests pass
- [ ] `npm run build` succeeds
- [ ] `AuthConfig` type matches every field accessed in codebase (17 files use `@auth`)
- [ ] `ServerStateData` matches `.server` file shape including all fields from save() replacer
- [ ] `VoiceRecord` matches shape enforced by `checkVoiceStructure()`
- [ ] Both command patterns (`BotCommand` and `Command`) are typed via `CommandLike`
- [ ] All 12 listener event types are defined
- [ ] Existing tests still pass

---

## Completion Checklist

- [ ] All 8 tasks completed in order
- [ ] Level 1: `npx tsc --noEmit` passes after each task
- [ ] Level 2: `npm test` all green
- [ ] Level 3: `npm run build` succeeds
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Types don't match actual runtime shapes | Medium | High | Types derived from codebase-analyst tracing, not guessed; tests validate against representative data |
| discord.js types conflict with our interfaces | Low | Medium | Use `import type` to avoid runtime conflicts; `skipLibCheck: true` in tsconfig |
| MemberSettings index signature too permissive | Low | Low | Acceptable for migration — can tighten in later phases |
| Some .server files have fields not in interface | Medium | Low | All observed fields included; index signature on specific types if needed |

---

## Notes

- Types use `unknown` for circular references (e.g., `Server` in command types) — these will be replaced with concrete types as models are converted in later phases.
- The `CommandLike` interface is deliberately loose to accommodate both `BotCommand` (execute receives args directly) and `Command` (execute receives `{ input }` wrapper). This will be unified in Phase 5.
- `MemberSettings` includes an index signature because command modules can add arbitrary settings keys.
- All types are exported via `src/types/index.ts` for clean imports in subsequent phases.
