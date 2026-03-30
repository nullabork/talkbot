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
    /** ISO date string in JSON */
    created: string;
    command_char?: string;
    /** ISO date string in JSON */
    updated: string;
    charLimit: number;
    fallbackLang: string;
    messages: Record<string, string>;
    /** Runtime-only fields that may leak into saved state */
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
