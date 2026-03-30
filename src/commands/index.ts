import type { ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand } from '../types/discord';
import type {
    CommandLike,
    ListenerCallback,
    ListenerEntry,
    ListenerType,
} from '../types/commands';

const path = require('path');
const fs = require('fs');
const MessageDetails = require('@models/MessageDetails');
const Command = require('@models/Command');
const Common = require('@helpers/common');
import { env } from '../env';

class Commands {
    commands: Record<string, CommandLike>;
    listeners: Record<string, ListenerEntry[]>;
    command_char: string;
    slashCommands: Map<string, SlashCommand>;

    constructor() {
        this.commands = {};
        this.listeners = {
            token: [],
            message: [],
            validate: [],
            preValidate: [],
            joinVoice: [],
            leaveVoice: [],
            follow: [],
            unfollow: [],
            configureSettings: [],
            configureVoice: [],
            userJoinedChannel: [],
            messageDelivered: [],
        };
        this.command_char = env.COMMAND_CHAR;
        this.slashCommands = new Map();
    }

    add(command: CommandLike, force?: boolean): void {
        const key = command.command_name.toLowerCase();
        if (this.commands[key] && !force) return;
        this.commands[key] = command;

        if (!command.listeners) return;

        const listeners = command.listeners as Record<string, ListenerCallback | null>;
        for (const type in listeners) {
            if (!listeners.hasOwnProperty(type) || !listeners[type]) continue;
            const sequence = (command.sequence && (command.sequence as any)[type]) || 0;
            const func = listeners[type] as ListenerCallback;
            this.on(type, func, sequence, command);
        }
    }

    addAll(commands: CommandLike[]): void {
        for (const command of commands) {
            this.add(command);
        }
    }

    registerAllCommands(): void {
        const modulesDir = path.resolve(__dirname, 'modules');
        fs.readdirSync(modulesDir).forEach((file: string) => {
            // Load .js files (compiled output) or .ts files (dev mode via ts-node)
            // Skip test files and declaration files
            if (file.endsWith('.test.ts') || file.endsWith('.test.js') || file.endsWith('.d.ts')) return;
            if (!file.endsWith('.js') && !file.endsWith('.ts')) return;
            const basename = file.replace(/\.(js|ts)$/, '');
            const filename = path.join('modules/', basename);
            const command = require('./' + filename);
            command.register(this);
        });
    }

    registerSlashCommands(): void {
        const talkbotCommand = require('./talkbot-command');
        const talkbotHandler = require('./talkbot-handler');
        this.slashCommands.set('talkbot', {
            data: talkbotCommand.data,
            execute: talkbotHandler.execute,
        });
        // /tb alias — same structure, shorter name
        this.slashCommands.set('tb', {
            data: talkbotCommand.tbData,
            execute: talkbotHandler.execute,
        });
    }

    remove(command: CommandLike): void {
        const key = command.command_name.toLowerCase();
        delete this.commands[key];

        if ((command as any).command_arg) {
            const arg = (command as any).command_arg.toLowerCase();
            delete this.commands[arg];
        }
    }

    removeAll(commands: CommandLike[]): void {
        for (const command of commands) {
            this.remove(command);
        }
    }

    runAllStartupTests(): void {
        for (const test in this.commands) {
            if (this.commands[test].startup) this.commands[test].startup!();
        }
    }

    get(key: string): CommandLike | null {
        key = key.toLowerCase();
        if (!this.commands[key]) return null;
        return this.commands[key];
    }

    run(key: string, args: unknown[]): unknown {
        key = key.toLowerCase();
        if (!this.commands[key]) return () => {};

        try {
            return this.commands[key].execute.apply(this, args);
        } catch (ex) {
            Common.error(ex);
            return null;
        }
    }

    on(type: string, cb: ListenerCallback, sequence: number, command: CommandLike): void {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push({
            cb,
            sequence: sequence || 0,
            command,
        });
    }

    notify(type: string, args: any): unknown {
        const funcs = this.listeners[type];
        if (!funcs || !funcs.length) return;

        funcs.sort((a, b) => a.sequence - b.sequence);

        let ret: unknown = null;
        try {
            for (let i = 0; i < funcs.length; i++) {
                const func = funcs[i].cb;
                const command = funcs[i].command;

                if (typeof func === 'function') {
                    const mergedArgs = {
                        ...args,
                        modified: ret,
                        command,
                    };
                    const resp = func.apply(this, [mergedArgs]);
                    if (resp !== null) {
                        ret = resp;
                    }
                }
            }
        } catch (ex) {
            Common.error(ex);
        }
        return ret;
    }

    isCommand(message: any, server: any): boolean {
        const char = this.getCommandChar(server);
        return (
            message.content.substring(0, char.length) === char ||
            message.content.indexOf(this.command_char + 'help') === 0
        );
    }

    isHelpCommand(message: any): boolean {
        return message.content.indexOf(this.command_char + 'help') === 0;
    }

    getCommandChar(server?: any): string {
        if (server) return server.command_char || this.command_char || '!';
        else return this.command_char || '!';
    }

    getSlashCommandData(): any[] {
        const data: any[] = [];
        for (const [, cmd] of this.slashCommands) {
            if (cmd.data && typeof cmd.data.toJSON === 'function') {
                data.push(cmd.data.toJSON());
            }
        }
        return data;
    }

    async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
        const commandName = interaction.commandName;
        const slashCmd = this.slashCommands.get(commandName);
        if (!slashCmd) {
            await interaction.reply({ content: 'Unknown command.', ephemeral: true });
            return;
        }

        try {
            await slashCmd.execute(interaction);
        } catch (error) {
            Common.error(error);
            const reply = { content: 'There was an error executing this command.', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }

    process(message: any, server: any, world: any): void {
        let parts: string[] | null = [];
        const command_char = this.getCommandChar(server);
        if (!this.isCommand(message, server)) return;

        if (this.isHelpCommand(message)) {
            parts = [command_char + 'help', command_char, 'help'];
        } else {
            parts = message.content.match(
                new RegExp('(' + Common.escapeRegExp(this.getCommandChar(server)) + ')([^ ]+)(.*)', 'i'),
            );
        }

        if (!parts || parts.length < 2) return;

        const cmdChar = parts[1];
        const cmdVerb = parts[2] || null;
        const cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
        const cmdContent = (parts[3] || '').trim();

        if (!cmdVerb || !cmdChar) return;

        const msgDets = new MessageDetails({
            world: world,
            server: server,
            message: message,
            cmdChar: cmdChar,
            cmd: cmdVerb,
            args: cmdArgs,
            content: cmdContent,
        });

        Common.out((server ? server.guild.id : 'DM') + ': ' + msgDets.cmd + ' ' + msgDets.content);

        const command = this.get(msgDets.cmd);
        if (!command) return;

        if (server) server.resetNeglectTimeout();

        if (command instanceof Command) {
            command.execute({ input: msgDets });
        } else {
            command.execute.apply(this, [msgDets]);
        }
    }
}

const commands = new Commands();
commands.registerAllCommands();
// Slash commands disabled — using prefix commands instead
// commands.registerSlashCommands();
commands.runAllStartupTests();

module.exports = commands;
