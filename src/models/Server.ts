import {
    joinVoiceChannel,
    createAudioResource,
    StreamType,
    AudioPlayerStatus,
    createAudioPlayer,
    NoSubscriberBehavior,
    getVoiceConnection,
    VoiceConnectionStatus,
} from '@discordjs/voice';
import type { VoiceConnection } from '@discordjs/voice';
import type { Guild, GuildMember, VoiceChannel, Message, VoiceState } from 'discord.js';
import type { ServerStateData, MemberSettings, AudioContent } from '../types';

const Lang = require('lang.js');
const paths = require('../paths');
const commands = require('@commands');
const botStuff = require('@helpers/bot-stuff');
const Common = require('@helpers/common');
const fs = require('fs');
const TextToSpeechService = require('@services/TextToSpeechService');
const Measure = require('@services/Measure');
import type { Trace } from '@services/Measure';
import { env } from '../env';

const TIMEOUT_NEGLECT: number = env.NEGLECT_TIMEOUT;

const NEGLECT_TIMEOUT_MESSAGES: string[] = env.NEGLECT_TIMEOUT_MESSAGES.split(',').map((s: string) => s.trim());

class Server {
    server_id: string;
    player: any;
    server_name: string;
    audioEmojis: Record<string, string>;
    memberSettings: Record<string, MemberSettings>;
    textrules: Record<string, string>;
    bound_to: GuildMember | null;
    permitted: Record<string, boolean>;
    neglect_timeout: ReturnType<typeof setTimeout> | null;
    defaultProvider: string;
    language: string;
    adminrole: string;
    restrictions: string[];
    bind: string[];
    bindPermit: boolean;
    keepMessages: Record<string, unknown>;
    stats: any;
    created: Date | string;
    command_char: string | undefined;
    updated: Date;
    charLimit: number;
    world: any;
    guild: Guild;
    fallbackLang: string;
    commandResponses: any;
    messages: Record<string, string>;
    connecting?: boolean;
    playing?: boolean;
    leaving?: boolean;
    audioQueue?: Array<() => Promise<void>>;
    voice_timeout?: ReturnType<typeof setTimeout> | null;

    constructor(guild: Guild, world: any) {
        // the id of this server, note this needs to be before loadState();
        this.server_id = guild.id;

        // the voice channel the bot is in
        this.player = null;

        // get the state file from the disk
        const state_data: Partial<ServerStateData> = this.loadState() || {};

        // name of the server
        this.server_name = guild.name;

        // a list of the audioEmojis for !sfx command
        this.audioEmojis = state_data.audioEmojis || {};

        // general member settings, used in quite a few commands
        this.memberSettings = state_data.memberSettings || {};

        // list of text rules for !textrule, default settings as well
        this.textrules = state_data.textrules || require('../config-loader').loadJsonConfig('default.textrules.json');

        // set if the server is bound to a master
        this.bound_to = null;

        // when bound this will include the master, !permit to add others
        this.permitted = {};

        // created to timeout the !follow if the bot is not used
        this.neglect_timeout = null;

        // default provider for voices
        this.defaultProvider = state_data.defaultProvider || '';

        // language of the server
        this.language = state_data.language || 'en-AU';

        // what role can admin this server
        this.adminrole = state_data.adminrole || '';

        // restrict talkbot to a specific server
        this.restrictions = state_data.restrictions || [];

        // bind talkbot to a autofollow joining people
        this.bind = state_data.bind || [];

        // allow people to be auto permitted
        this.bindPermit = state_data.bindPermit || false;

        // queue for !keep
        this.keepMessages = state_data.keepMessages || {};

        // statistics on this server
        this.stats = state_data.stats || {};

        // when was the server originally created
        this.created = state_data.created || new Date();

        // command char override for this server
        this.command_char = state_data.command_char;

        // when was this server last created in memory
        this.updated = new Date();

        // max number of chars this server can speak - to avoid spamming the APIs
        this.charLimit = state_data.charLimit || 100000;

        // a reference to the world object
        this.world = world;

        // a reference to the discord js guild object
        this.guild = guild;

        // idk?
        this.fallbackLang = 'en';

        // access the lang file
        this.commandResponses = new Lang({
            messages: require('../config-loader').loadLangJson(),
            locale: 'en',
            fallback: (this.fallbackLang = 'en'),
        });

        // idk??
        this.messages = {};
    }

    get connection(): VoiceConnection | undefined {
        return getVoiceConnection(this.server_id);
    }

    // GuildMember
    setMaster(member: GuildMember): void {
        this.bound_to = member;
        this.permit(member.id);
        this.resetNeglectTimeout();
        this.save();
    }

    addSettings(key: string, add: any): void {
        if (typeof add == 'object' && !(this as any)[key]) (this as any)[key] = {};
        if ((this as any)[key]) {
            (this as any)[key] = {
                ...(this as any)[key],
                ...add,
            };
        }
    }

    deleteSettings(key: string): void {
        delete (this as any)[key];
    }

    getSettingObject(name: string): Record<string, any> {
        if (!(this as any)[name] || typeof (this as any)[name] !== 'object') return {};
        return (this as any)[name];
    }

    getSettingObjectValue(objName: string, valueKey: string): any {
        const object = this.getSettingObject(objName);
        if (typeof object[valueKey] == 'undefined') return null;
        return object[valueKey];
    }

    addMemberSetting(member: GuildMember, name: string, value: any): any {
        if (!member) return;
        if (!this.memberSettings) this.memberSettings = {};
        if (!this.memberSettings[member.id]) {
            this.memberSettings[member.id] = {};
        }

        this.memberSettings[member.id][name] = value;
        this.save();
        return value;
    }

    clearMemberSettings(member: GuildMember): void {
        if (!member) return;
        if (!this.memberSettings) this.memberSettings = {};
        this.memberSettings[member.id] = {};
        this.save();
    }

    getMemberSetting(member: GuildMember | null, name: string): any {
        if (!member) return null;
        if (!this.memberSettings || !this.memberSettings[member.id] || !this.memberSettings[member.id][name])
            return null;
        return this.memberSettings[member.id][name];
    }

    deleteMemberSetting(member: GuildMember, name: string): void {
        if (!member) return;
        if (!this.memberSettings || !this.memberSettings[member.id] || !this.memberSettings[member.id][name])
            return;
        delete this.memberSettings[member.id][name];
    }

    getMemberSettings(member: GuildMember | null): MemberSettings {
        if (!member) return {};
        if (!this.memberSettings || !this.memberSettings[member.id]) return {};
        return this.memberSettings[member.id];
    }

    lang(key: string, params?: Record<string, any>): string {
        if (this.isLangKey(key)) {
            return this.messages[key];
        }

        if (!params) params = {};

        const command_char = commands.getCommandChar(this);
        const title = params.title || this.world.default_title;

        params = {
            ...params,
            command_char,
            title,
        };

        return this.commandResponses.get.apply(this.commandResponses, [key, params]);
    }

    isLangKey(possible_key: string): boolean {
        return !!(this.messages && this.messages[possible_key]);
    }

    // GuildMember
    isMaster(member: GuildMember | null): boolean {
        if (!member) return false;
        if (!this.bound_to) return false;
        return this.bound_to.id == member.id;
    }

    // true if this server is bound to a user already
    isBound(): boolean {
        return this.bound_to != null;
    }

    // does this server think it's in a voice channel
    inChannel(): boolean {
        return this.connection != null;
    }

    release(callback?: () => void): void {
        const server = this;

        if (!server.connection) return;

        if (server.leaving) return; // dont call it twice dude

        if (callback) server.connection.on(VoiceConnectionStatus.Disconnected, callback);

        commands.notify('leaveVoice', { server: server });

        server.connection.destroy();
    }

    // get the server to join a voice channel
    async joinVoiceChannel(voiceChannel: VoiceChannel): Promise<VoiceConnection | false | undefined> {
        const server = this;
        if (server.connecting)
            return Common.error('joinVoiceChannel(' + voiceChannel.id + '): tried to connect twice!');
        if (server.inChannel())
            return Common.error(
                'joinVoiceChannel(' +
                    voiceChannel.id +
                    '): already joined to ' +
                    server.connection!.joinConfig.channelId +
                    '!',
            );
        server.connecting = true;
        try {
            // join the voice channel and setup all the listeners to deal with events
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: server.guild.id,
                adapterCreator: server.guild.voiceAdapterCreator,
            });
        } catch (e) {
            server.stop('joinError');
            server.bound_to = null;
            server.permitted = {};
            server.connecting = false;
            Common.error(e);
            return false;
        }

        // when closing stop the voices and clear the neglect timeout
        server.connection!.on('closing' as any, () => {
            server.leaving = true;
            server.stop('voiceClosing'); // stop playing
            if (server.neglect_timeout) clearTimeout(server.neglect_timeout);
        });

        // if an error occurs treat it like a d/c but capture the error
        server.connection!.on(VoiceConnectionStatus.Destroyed, () => {
            server.bound_to = null;
            server.permitted = {};
            server.leaving = false;
            server.connecting = false;
        });

        server.connecting = false;
        server.save();
        server.world.setPresence();
        commands.notify('joinVoice', { server: server });

        return server.connection;
    }

    // switch from whatever the current voice channel is to this voice channel
    async switchVoiceChannel(voiceChannel: VoiceChannel): Promise<void> {
        const server = this;
        if (!voiceChannel) return Common.error(new Error('null voiceChannel passed'));
        if (!server.connection) { await server.joinVoiceChannel(voiceChannel); return; }
        if (voiceChannel.id == server.connection.joinConfig.channelId)
            return Common.error('voiceChannel already joined');

        server.connection.rejoin({ channelId: voiceChannel.id, selfDeaf: false, selfMute: false });
    }

    // permit another user to speak
    permit(snowflake_id: string): void {
        this.resetNeglectTimeout();
        const member = this.guild.members.cache.find((m: GuildMember) => m.id == snowflake_id);
        if (member) this.addMemberSetting(member, 'toLanguage', 'default');
        this.permitted[snowflake_id] = true;
        this.save();
    }

    // unpermit another user to speak
    unpermit(snowflake_id: string): void {
        this.resetNeglectTimeout();
        this.permitted[snowflake_id] = false;
        this.save();
    }

    // is this user permitted to speak
    isPermitted(member: GuildMember | null): boolean {
        if (!member) return false;
        if (this.permitted[member.id] === false) return false;

        for (const snowflake_id in this.permitted) {
            if (this.permitted[snowflake_id])
                if (snowflake_id == member.id || member.roles.cache.has(snowflake_id)) return true;
        }
        return false;
    }

    // reset the timer that unfollows a user if they dont use the bot
    resetNeglectTimeout(): void {
        const server = this;

        const neglected_timeout = function () {
            server.neglected();
        };

        if (server.neglect_timeout) clearTimeout(server.neglect_timeout);
        if (TIMEOUT_NEGLECT > 0) server.neglect_timeout = setTimeout(neglected_timeout, TIMEOUT_NEGLECT);
    }

    // called when the neglect timeout expires
    neglected(): void {
        const server = this;

        const neglectedrelease = function () {
            const timeout_neglectedrelease = function () {
                Common.out('neglected: in chan');
                server.release();
            };
            setTimeout(timeout_neglectedrelease, 3000);
        };

        if (server.inChannel()) {
            server.talk(
                NEGLECT_TIMEOUT_MESSAGES[Math.floor(Math.random() * NEGLECT_TIMEOUT_MESSAGES.length)],
                null,
                neglectedrelease,
            );
        } else {
            Common.out('neglected: server.release() not in chan');
            server.release();
        }
    }

    // run this to cleanup resources before shutting down
    shutdown(): void {
        Common.out('shutdown(): ' + new Error().stack);
        const server = this;

        if (server.inChannel()) {
            server.talk('The server is shutting down', null, () => server.release());
        } else {
            server.release();
        }
    }

    // when the server is deleted or shutdown or disconnected run this to cleanup things
    dispose(): void {
        this.shutdown();
        if (this.neglect_timeout) clearTimeout(this.neglect_timeout);
    }

    // save the state file
    save(_filename?: string): void {
        const self = this;
        this.updated = new Date();
        function replacer(key: string, value: any): any {
            if (key.endsWith('_timeout')) return undefined;
            if (key == 'commandResponses') return undefined;
            if (key == 'bound_to') return undefined;
            if (key == 'world') return undefined;
            if (key == 'guild') return undefined;
            if (key == 'keepQueue') return undefined;
            if (key == 'switchQueue') return undefined;
            if (key == 'twitch') return undefined;
            if (key == 'connection') return undefined;
            if (key == 'player') return undefined;
            else return value;
        }

        if (!_filename) _filename = paths.config + '/' + self.server_id + '.server';
        fs.writeFileSync(_filename, JSON.stringify(self, replacer), 'utf-8');
    }

    // load the state file
    loadState(): Partial<ServerStateData> | null {
        const self = this;
        const _filename: string = paths.config + '/' + self.server_id + '.server';

        if (fs.existsSync(_filename)) {
            return JSON.parse(fs.readFileSync(_filename, 'utf-8'));
        }

        return null;
    }

    // speak a message in a voice channel - raw text
    talk(message: string, options: any, callback?: () => void, trace?: Trace | null): void {
        const server = this;

        if (!server.inChannel()) return;

        if (!options) options = {};

        if (!callback) callback = function () {};

        const settings: any = {};

        if (options.name != 'default') settings.name = options.name;
        if (options.pitch != 'default') settings.pitch = options.pitch;
        if (options.speed != 'default') settings.speed = options.speed;
        if (options.voice_provider) settings.voice_provider = options.voice_provider;

        server.resetNeglectTimeout();

        const service =
            TextToSpeechService.getService(settings.voice_provider || server.defaultProvider) ||
            TextToSpeechService.defaultProvider;

        const request = service.buildRequest(message, settings, server);
        trace?.mark('build_request');

        // Performs the Text-to-Speech request
        trace?.mark('api_call_start');
        service.getAudioContent(request, async (err: Error | null, audio: AudioContent | null) => {
            trace?.mark('api_call_end');
            if (err) {
                Common.error(err);
                return;
            }
            try {
                await server.playAudioContent(audio!, service.format, callback!, trace);
            } catch (e) {
                Common.error(e);
            }
        });
    }

    channelJoined(channelState: VoiceState): void {
        commands.notify('userJoinedChannel', {
            channelState: channelState,
            member: channelState.member,
            server: this,
        });
    }

    // stop currently playing audio and empty the audio queue (all=true)
    stop(reason?: string, all?: boolean): void {
        if (all) {
            this.audioQueue = [];
        }

        if (this.player) this.player.stop({ force: true });
    }

    // internal function for playing audio content returned from the TTS API and queuing it
    async playAudioContent(audioContent: AudioContent, format: string, callback: () => void, trace?: Trace | null): Promise<void> {
        const server = this;
        let readable: any = audioContent;

        if (!readable.pipe && typeof readable != 'function') {
            return Common.error(
                new Error('playAudioContent: Received audioContent that was not a readable stream'),
            );
        }

        const endFunc = async (reason: string) => {
            if (server.voice_timeout) clearTimeout(server.voice_timeout);
            server.playing = false;
            if ((server.connection as any)?.dispatcher)
                (server.connection as any).dispatcher.setSpeaking(false);
            server.voice_timeout = null;
            trace?.mark('playback_end');
            trace?.end();
            try {
                callback();
            } catch (ex) {
                Common.error(ex);
            }
            if (!server.audioQueue) return;
            const nextAudio = server.audioQueue.shift();
            if (reason != 'stream') {
                server.audioQueue = [];
                Common.error('Cancelled queue: ' + reason);
            } else if (nextAudio) await nextAudio();
        };

        // queue it up if there's something playing
        if (server.playing) {
            if (!server.audioQueue) server.audioQueue = [];
            trace?.mark('queue_wait_start');
            const queueFunc = async () => {
                trace?.mark('queue_wait_end');
                await server.playAudioContent(readable, format, callback, trace);
            };
            server.audioQueue.push(queueFunc);
            return;
        }

        if (server.leaving) return;
        if (!server.connection)
            return Common.error(
                "Tried to play audio content when there's no voice connection. " + new Error().stack,
            );

        // play the content
        server.playing = true;
        if (server.voice_timeout) clearTimeout(server.voice_timeout);
        server.voice_timeout = setTimeout(
            () =>
                (server.connection as any)?.dispatcher
                    ? (server.connection as any).dispatcher.end('timeout')
                    : null,
            60000,
        );

        try {
            server.player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            server.player.on(AudioPlayerStatus.Idle, () => {
                endFunc('stream');
            });

            if (typeof readable == 'function') {
                trace?.mark('transcode_start');
                readable = await readable();
                trace?.mark('transcode_end');
            }

            trace?.mark('playback_start');
            server.player.play(readable);
            server.connection!.subscribe(server.player);
        } catch (ex) {
            Common.error(ex);
        }
    }

    // call this if you want to check a msg content is valid and run it through translation
    speak(message: Message): void {
        const server = this;
        const trace: Trace | null = Measure.getInstance().start();
        const settings = server.getMemberSettings(message.member as GuildMember | null);

        const ret = commands.notify('preValidate', {
            message: message,
            content: message.cleanContent,
            server: server,
        });

        if (
            ret === false ||
            message.cleanContent.length < 1 ||
            Common.isMessageExcluded(message.cleanContent) ||
            !server.inChannel() ||
            !server.isPermitted(message.member as GuildMember | null) ||
            settings.muted
        )
            return;

        const accept = commands.notify('validate', {
            message: message,
            server: server,
        });

        if (accept === false) return;

        let content = Common.cleanMessage(message.cleanContent);

        const modifiedContent = commands.notify('message', {
            message: message,
            content: content,
            server: server,
        });
        if (modifiedContent) content = modifiedContent;

        if (content.length < 1) return;

        trace?.mark('clean');

        const voiceRet = commands.notify('configureVoice', {
            message: message,
            original_settings: settings,
            server: server,
        });
        const finalSettings = voiceRet || settings;

        function _speak(msg: string, spkSettings: any) {
            server.talk(msg, spkSettings, () =>
                commands.notify('messageDelivered', {
                    message: message,
                    content: message.content,
                    server: server,
                }),
            trace);
        }

        const tolang = server.getMemberSetting(message.member as GuildMember | null, 'toLanguage');
        if (tolang && tolang != 'default') {
            trace?.mark('translate_start');
            botStuff.translate_client
                .translate(content, tolang)
                .then((results: any[]) => {
                    trace?.mark('translate_end');
                    _speak(results[0], finalSettings);
                })
                .catch(Common.error);
        } else {
            _speak(content, finalSettings);
        }
    }
}

module.exports = Server;
