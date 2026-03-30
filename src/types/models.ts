/** Data passed to CommentBuilder constructor */
export interface CommentBuilderData {
    padding?: string;
    formatKey?: boolean;
    data?: Record<string, unknown> | unknown[] | string;
    keyMap?: Record<string, string>;
}

/** SSMLTag properties — maps Discord markdown tokens to SSML elements */
export interface SSMLTagData {
    open: string | null;
    close: string | null;
    type: string | null;
    attributes: Record<string, string>;
}

/** Discord-to-SSML tag dictionary entry with methods */
export interface SSMLDictionaryEntry extends SSMLTagData {
    openString(): string;
    closeString(): string;
    getAttributesString(): string;
}

/** Options passed to MessageSSML constructor */
export interface MessageSSMLOptions {
    server: unknown;
}
