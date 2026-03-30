import type { Message, Collection, Role } from 'discord.js';

/** Listener callback function signature */
export type ListenerCallback = (args: ListenerArgs) => unknown;

/** Base args shape passed to all listener callbacks */
export interface ListenerArgs {
    server: unknown;
    modified?: unknown;
    command?: unknown;
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

/** Map of listener event names to arrays of registered listeners */
export type ListenerMap = Record<ListenerType, ListenerEntry[]>;

/** Listener map as defined on a command (event name to handler function or null) */
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

/** Data object passed to BotCommand constructor */
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

/** Minimal MessageDetails shape for typing purposes */
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

/** Command module export contract — every file in src/commands/modules/ */
export interface CommandModule {
    register(commands: unknown): void;
    unRegister(commands: unknown): void;
}
