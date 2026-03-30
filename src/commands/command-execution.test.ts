import { describe, it, expect, vi } from 'vitest';

// Reuse the same mocks from commands.test.ts so command modules can be imported
// BotCommand and Command use module.exports = Class, so the mock must
// return a callable constructor that stores the passed data as properties
class MockBotCommand {
    command_name: string | null = null;
    [key: string]: any;
    constructor(data?: any) { if (data) Object.assign(this, data); }
    execute() {}
}
class MockCommand {
    static get command() { return new this(); }
    get command_name() { return this.constructor.name.toLowerCase(); }
    get hidden() { return true; }
    get group() { return 'misc'; }
    get listeners() { return {}; }
    get sequence() { return { message: 0, token: 0 }; }
    execute() {}
}
vi.mock('@models/Command', () => MockCommand);
vi.mock('@models/BotCommand', () => MockBotCommand);
vi.mock('@models/CommentBuilder', () => ({ default: { create: () => '' } }));
vi.mock('@models/World', () => ({ default: { servers: {} } }));
vi.mock('@models/MessageSSML', () => ({ default: class { build() { return ''; } } }));
vi.mock('@helpers/common', () => ({
    default: {
        error: () => {},
        out: () => {},
        escapeRegExp: (s: string) => s,
        numberClamp: (n: number, min: number, max: number) => Math.min(max, Math.max(min, n)),
        isURL: () => false,
        makeAudioSSML: () => '',
        makeNiceCsv: () => '',
        camelize: (s: string) => s,
        hashCode: () => 0,
    },
}));
vi.mock('@helpers/bot-stuff', () => ({
    default: {
        bot: { user: { id: '123' } },
        canManageTheServer: () => false,
        canManageTheBot: () => false,
        botHasManageMessagePermissions: () => true,
    },
}));
vi.mock('@auth', () => ({
    default: {
        command_char: '!',
        dev_ids: [],
        servers: {},
    },
}));
vi.mock('@services/TextToSpeechService', () => ({
    default: {
        getVoice: () => null,
        isValidLang: () => false,
        getVoiceRecords: () => [{}],
        providers: {},
    },
}));
vi.mock('tmi.js', () => ({
    default: { client: class { connect() {} addListener() {} } },
}));
vi.mock('util', () => ({ default: { inspect: (v: unknown) => String(v) } }));

import { data } from './talkbot-command';
import { execute, dispatchMap } from './talkbot-handler';
import * as ping from './modules/ping';
import * as sfx from './modules/sfx';
import * as myvoice from './modules/myvoice';
import * as transfer from './modules/transfer';
import * as debugbork from './modules/debugbork';

describe('Talkbot root command structure', () => {
    it('data.name === "talkbot"', () => {
        expect(data.name).toBe('talkbot');
    });

    it('data has a description', () => {
        expect(data.description).toBe('TalkBot text-to-speech commands');
    });

    it('ping is in the info group dispatch map', () => {
        expect(dispatchMap.info.ping).toBe('ping');
    });

    it('sfx is in the server group dispatch map', () => {
        expect(dispatchMap.server.sfx).toBe('sfx');
    });

    it('set is in the voice group dispatch map', () => {
        expect(dispatchMap.voice.set).toBe('myvoice');
    });

    it('transfer is in the do group dispatch map', () => {
        expect(dispatchMap.do.transfer).toBe('transfer');
    });

    it('debugbork is in the dev group dispatch map', () => {
        expect(dispatchMap.dev.debugbork).toBe('debugbork');
    });
});

describe('Command execution — module execute functions', () => {
    it('all tested commands have execute as async function', () => {
        const commands = [ping, sfx, myvoice, transfer, debugbork];
        for (const cmd of commands) {
            expect(typeof cmd.execute).toBe('function');
            // Async functions have constructor name 'AsyncFunction'
            expect(cmd.execute.constructor.name).toBe('AsyncFunction');
        }
    });

    it('ping execute is a function that can be called', () => {
        expect(typeof ping.execute).toBe('function');
    });

    it('talkbot handler execute is a function', () => {
        expect(typeof execute).toBe('function');
        expect(execute.constructor.name).toBe('AsyncFunction');
    });
});

describe('Subcommand option definitions in talkbot command', () => {
    const json = data.toJSON() as any;
    const getGroup = (name: string) => json.options.find((o: any) => o.name === name);
    const getSub = (groupName: string, subName: string) => {
        const group = getGroup(groupName) as any;
        return group?.options?.find((o: any) => o.name === subName);
    };

    it('do/transfer has a user option named "user"', () => {
        const sub = getSub('do', 'transfer');
        expect(sub).toBeDefined();
        const userOpt = sub!.options?.find((o: any) => o.name === 'user');
        expect(userOpt).toBeDefined();
        // SlashCommandUserOption type === 6
        expect(userOpt!.type).toBe(6);
        expect(userOpt!.required).toBe(true);
    });

    it('voice/set has a string option named "voice"', () => {
        const sub = getSub('voice', 'set');
        expect(sub).toBeDefined();
        const voiceOpt = sub!.options?.find((o: any) => o.name === 'voice');
        expect(voiceOpt).toBeDefined();
        // SlashCommandStringOption type === 3
        expect(voiceOpt!.type).toBe(3);
        expect(voiceOpt!.required).toBe(true);
    });

    it('server/sfx has a required string action option', () => {
        const sub = getSub('server', 'sfx');
        expect(sub).toBeDefined();
        const actionOpt = sub!.options?.find((o: any) => o.name === 'action');
        expect(actionOpt).toBeDefined();
        expect(actionOpt!.type).toBe(3);
        expect(actionOpt!.required).toBe(true);
    });

    it('server/sfx action option has 5 choices', () => {
        const sub = getSub('server', 'sfx');
        const actionOpt = sub!.options?.find((o: any) => o.name === 'action');
        expect(actionOpt!.choices!.length).toBe(5);
        const choiceValues = actionOpt!.choices!.map((c: any) => c.value);
        expect(choiceValues).toContain('set');
        expect(choiceValues).toContain('list');
        expect(choiceValues).toContain('del');
        expect(choiceValues).toContain('clearall');
        expect(choiceValues).toContain('play');
    });

    it('dev/debugbork has an optional integer minutes option', () => {
        const sub = getSub('dev', 'debugbork');
        expect(sub).toBeDefined();
        const minOpt = sub!.options?.find((o: any) => o.name === 'minutes');
        expect(minOpt).toBeDefined();
        // SlashCommandIntegerOption type === 4
        expect(minOpt!.type).toBe(4);
        expect(minOpt!.required).toBeFalsy();
    });
});

describe('All command modules have register and unRegister exports', () => {
    // These test the imports directly — each module must export register and unRegister
    const modules = [
        ping, sfx, myvoice, transfer, debugbork,
    ];

    it('all tested modules export register as a function', () => {
        for (const mod of modules) {
            expect(typeof mod.register).toBe('function');
        }
    });

    it('all tested modules export unRegister as a function', () => {
        for (const mod of modules) {
            expect(typeof mod.unRegister).toBe('function');
        }
    });

    it('every .ts module in modules/ has register and unRegister', () => {
        // This is a build-time check — we verify via the compiled dist/ output
        const fs = require('fs');
        const path = require('path');
        const distModulesDir = path.resolve(process.cwd(), 'dist/src/commands/modules');
        if (!fs.existsSync(distModulesDir)) return; // skip if not built

        const files = fs.readdirSync(distModulesDir)
            .filter((f: string) => f.endsWith('.js') && !f.includes('.test.') && !f.includes('.map'));

        for (const file of files) {
            const mod = require(path.join(distModulesDir, file));
            expect(typeof mod.register, `${file} missing register()`).toBe('function');
            expect(typeof mod.unRegister, `${file} missing unRegister()`).toBe('function');
        }
    });

    it('compiled modules register all 37+ commands', () => {
        const fs = require('fs');
        const path = require('path');
        const distModulesDir = path.resolve(process.cwd(), 'dist/src/commands/modules');
        if (!fs.existsSync(distModulesDir)) return; // skip if not built

        const registered: string[] = [];
        const mockCommands = {
            commands: {} as any,
            listeners: {} as any,
            command_char: '!',
            add: (cmd: any) => { if (cmd?.command_name) registered.push(cmd.command_name); },
            addAll: (cmds: any[]) => cmds?.forEach((c: any) => { if (c?.command_name) registered.push(c.command_name); }),
            on: () => {},
            get: () => null,
            getCommandChar: () => '!',
        };

        const files = fs.readdirSync(distModulesDir)
            .filter((f: string) => f.endsWith('.js') && !f.includes('.test.') && !f.includes('.map'));

        for (const file of files) {
            const mod = require(path.join(distModulesDir, file));
            try { mod.register(mockCommands); } catch (_e) { /* some may fail without full env */ }
        }

        expect(registered.length, `Only ${registered.length} commands registered, expected 37+`).toBeGreaterThanOrEqual(37);
    });
});
