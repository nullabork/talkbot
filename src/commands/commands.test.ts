import { describe, it, expect, vi } from 'vitest';

// Mock heavy dependencies that command modules require at import time
vi.mock('@models/Command', () => ({ default: class {} }));
vi.mock('@models/BotCommand', () => ({ default: class {} }));
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

// Import the talkbot root command and handler
import { data } from './talkbot-command';
import { execute, dispatchMap } from './talkbot-handler';

// Import individual modules to verify they still export execute
import * as ping from './modules/ping';
import * as defaults from './modules/defaults';
import * as who from './modules/who';
import * as invite from './modules/invite';
import * as voices from './modules/voices';
import * as help from './modules/help';
import * as details from './modules/details';
import * as myvoice from './modules/myvoice';
import * as mypitch from './modules/mypitch';
import * as myspeed from './modules/myspeed';
import * as mytitle from './modules/mytitle';
import * as tolang from './modules/tolang';
import * as announceme from './modules/announceme';
import * as myprefix from './modules/myprefix';
import * as mysuffix from './modules/mysuffix';
import * as puberty from './modules/puberty';
import * as follow from './modules/follow';
import * as unfollow from './modules/unfollow';
import * as sidle from './modules/sidle';
import * as transfer from './modules/transfer';
import * as permit from './modules/permit';
import * as unpermit from './modules/unpermit';
import * as tts from './modules/tts';
import * as mute from './modules/mute';
import * as unmute from './modules/unmute';
import * as stop from './modules/stop';
import * as adminrole from './modules/adminrole';
import * as commandchar from './modules/commandchar';
import * as restrict from './modules/restrict';
import * as keep from './modules/keep';
import * as stats from './modules/stats';
import * as sfx from './modules/sfx';
import * as textrule from './modules/textrule';
import * as bind from './modules/bind';
import * as twitch from './modules/twitch';
import * as debugbork from './modules/debugbork';
import * as evalo from './modules/evalo';

const modules: Array<{ name: string; mod: any }> = [
    { name: 'ping', mod: ping },
    { name: 'defaults', mod: defaults },
    { name: 'who', mod: who },
    { name: 'invite', mod: invite },
    { name: 'voices', mod: voices },
    { name: 'help', mod: help },
    { name: 'details', mod: details },
    { name: 'myvoice', mod: myvoice },
    { name: 'mypitch', mod: mypitch },
    { name: 'myspeed', mod: myspeed },
    { name: 'mytitle', mod: mytitle },
    { name: 'tolang', mod: tolang },
    { name: 'announceme', mod: announceme },
    { name: 'myprefix', mod: myprefix },
    { name: 'mysuffix', mod: mysuffix },
    { name: 'puberty', mod: puberty },
    { name: 'follow', mod: follow },
    { name: 'unfollow', mod: unfollow },
    { name: 'sidle', mod: sidle },
    { name: 'transfer', mod: transfer },
    { name: 'permit', mod: permit },
    { name: 'unpermit', mod: unpermit },
    { name: 'tts', mod: tts },
    { name: 'mute', mod: mute },
    { name: 'unmute', mod: unmute },
    { name: 'stop', mod: stop },
    { name: 'adminrole', mod: adminrole },
    { name: 'commandchar', mod: commandchar },
    { name: 'restrict', mod: restrict },
    { name: 'keep', mod: keep },
    { name: 'stats', mod: stats },
    { name: 'sfx', mod: sfx },
    { name: 'textrule', mod: textrule },
    { name: 'bind', mod: bind },
    { name: 'twitch', mod: twitch },
    { name: 'debugbork', mod: debugbork },
    { name: 'evalo', mod: evalo },
];

describe('Talkbot root command', () => {
    it('has name "talkbot"', () => {
        expect(data.name).toBe('talkbot');
    });

    it('has a description', () => {
        expect(data.description.length).toBeGreaterThan(0);
    });

    it('serializes to JSON with toJSON()', () => {
        const json = data.toJSON();
        expect(json.name).toBe('talkbot');
        expect(json.options).toBeDefined();
    });

    it('has 5 subcommand groups', () => {
        const json = data.toJSON();
        // type 2 = SUB_COMMAND_GROUP
        const groups = json.options!.filter((o: any) => o.type === 2);
        expect(groups.length).toBe(5);
        const groupNames = groups.map((g: any) => g.name).sort();
        expect(groupNames).toEqual(['dev', 'do', 'info', 'server', 'voice']);
    });

    it('do group has 8 subcommands', () => {
        const json = data.toJSON() as any;
        const doGroup = json.options.find((o: any) => o.name === 'do');
        expect(doGroup).toBeDefined();
        expect(doGroup.options.length).toBe(8);
    });

    it('voice group has 11 subcommands', () => {
        const json = data.toJSON() as any;
        const voice = json.options.find((o: any) => o.name === 'voice');
        expect(voice).toBeDefined();
        expect(voice.options.length).toBe(11);
    });

    it('info group has 7 subcommands', () => {
        const json = data.toJSON() as any;
        const info = json.options.find((o: any) => o.name === 'info');
        expect(info).toBeDefined();
        expect(info.options.length).toBe(7);
    });

    it('server group has 10 subcommands', () => {
        const json = data.toJSON() as any;
        const server = json.options.find((o: any) => o.name === 'server');
        expect(server).toBeDefined();
        expect(server.options.length).toBe(10);
    });

    it('dev group has 2 subcommands', () => {
        const json = data.toJSON() as any;
        const dev = json.options.find((o: any) => o.name === 'dev');
        expect(dev).toBeDefined();
        expect(dev.options.length).toBe(2);
    });

    it('no group exceeds 25 subcommands (Discord limit)', () => {
        const json = data.toJSON() as any;
        const groups = json.options.filter((o: any) => o.type === 2);
        for (const group of groups) {
            expect(
                group.options.length,
                `${group.name} has ${group.options.length} subcommands (max 25)`,
            ).toBeLessThanOrEqual(25);
        }
    });

    it('all subcommand names are lowercase alphanumeric', () => {
        const json = data.toJSON() as any;
        const groups = json.options.filter((o: any) => o.type === 2);
        for (const group of groups) {
            for (const sub of group.options) {
                expect(
                    /^[a-z0-9-]+$/.test(sub.name),
                    `${group.name}/${sub.name} contains invalid characters`,
                ).toBe(true);
            }
        }
    });

    it('all subcommand descriptions are at most 100 characters', () => {
        const json = data.toJSON() as any;
        const groups = json.options.filter((o: any) => o.type === 2);
        for (const group of groups) {
            for (const sub of group.options) {
                expect(
                    sub.description.length,
                    `${group.name}/${sub.name} description too long`,
                ).toBeLessThanOrEqual(100);
            }
        }
    });
});

describe('Talkbot handler dispatch map', () => {
    it('has entries for all 5 groups', () => {
        expect(Object.keys(dispatchMap).sort()).toEqual(['dev', 'do', 'info', 'server', 'voice']);
    });

    it('maps 38 total subcommands', () => {
        let total = 0;
        for (const group of Object.values(dispatchMap)) {
            total += Object.keys(group).length;
        }
        expect(total).toBe(38);
    });

    it('execute is a function', () => {
        expect(typeof execute).toBe('function');
    });

    it('every dispatch map entry references a valid module name', () => {
        const moduleNames = new Set(modules.map(m => m.name));
        for (const [group, subs] of Object.entries(dispatchMap)) {
            for (const [subName, moduleName] of Object.entries(subs)) {
                expect(
                    moduleNames.has(moduleName),
                    `${group}/${subName} references unknown module "${moduleName}"`,
                ).toBe(true);
            }
        }
    });
});

describe('Individual module execute functions', () => {
    it('should have at least 30 command modules', () => {
        expect(modules.length).toBeGreaterThanOrEqual(30);
    });

    it('every module has an execute function', () => {
        for (const { name, mod } of modules) {
            expect(typeof mod.execute, `${name} missing execute function`).toBe('function');
        }
    });

    it('every module has register and unRegister functions', () => {
        for (const { name, mod } of modules) {
            expect(typeof mod.register, `${name} missing register function`).toBe('function');
            expect(typeof mod.unRegister, `${name} missing unRegister function`).toBe('function');
        }
    });

    it('commands with listeners have function-typed listeners', () => {
        for (const { name, mod } of modules) {
            if (mod.listeners) {
                expect(typeof mod.listeners, `${name} listeners should be an object`).toBe('object');
                for (const key in mod.listeners) {
                    expect(
                        typeof mod.listeners[key],
                        `${name} listener "${key}" should be a function`,
                    ).toBe('function');
                }
            }
        }
    });
});

describe('Expected subcommands exist in talkbot command', () => {
    const json = data.toJSON() as any;
    const groups = json.options.filter((o: any) => o.type === 2);

    const expectedByGroup: Record<string, string[]> = {
        do: ['follow', 'unfollow', 'sidle', 'transfer', 'tts', 'stop', 'mute', 'unmute'],
        voice: ['set', 'pitch', 'speed', 'title', 'tolang', 'defaults', 'puberty', 'announceme', 'prefix', 'suffix'],
        info: ['help', 'ping', 'who', 'invite', 'voices', 'details', 'stats'],
        server: ['permit', 'unpermit', 'adminrole', 'commandchar', 'restrict', 'keep', 'sfx', 'textrule', 'bind', 'twitch'],
        dev: ['debugbork', 'evalo'],
    };

    for (const [groupName, expectedSubs] of Object.entries(expectedByGroup)) {
        const group = groups.find((g: any) => g.name === groupName);
        const subNames = new Set(((group as any)?.options || []).map((s: any) => s.name));
        for (const sub of expectedSubs) {
            it(`has ${groupName}/${sub}`, () => {
                expect(subNames.has(sub), `Missing ${groupName}/${sub}`).toBe(true);
            });
        }
    }
});
