/**
 * Per-user settings stored in Server.memberSettings[userId].
 * Written via Server.addMemberSetting(), read via Server.getMemberSetting().
 */
export interface MemberSettings {
    name?: string;
    alias?: string;
    voice_provider?: string;
    pitch?: number;
    speed?: number;
    gender?: string;
    language?: string;
    code?: string;
    toLanguage?: string;
    muted?: boolean;
    mytitle?: string;
    announceme?: 'on' | 'off';
    myprefix?: string;
    mysuffix?: string;
    'amazon-xml-encode-disabled'?: boolean;
    'amazon-breaths-disabled'?: boolean;
    /** Allow extension by command modules */
    [key: string]: unknown;
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
