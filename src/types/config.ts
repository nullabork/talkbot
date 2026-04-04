/** Shape of config/config.json (non-secret bot configuration) */
export interface BotConfig {
    /** Keyed by guild snowflake or "-1" for global defaults */
    servers: Record<string, ServerOverride>;
    tts?: TTSConfig;
}

/**
 * @deprecated Use BotConfig instead. Kept for backwards compatibility.
 */
export type AuthConfig = BotConfig;

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
 * Shape of src/lang.json and config/lang.json.
 * Flat map of "locale.command.key" to template strings with :param interpolations.
 */
export type LangMessages = Record<string, Record<string, string>>;

/** Shape of the paths.js module export */
export interface Paths {
    state: string;
    botConfig: string;
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
