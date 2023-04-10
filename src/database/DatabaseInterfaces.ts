
//Bot settings interface
export interface BotSettingsDBInterface {
    id: number;
    defaultVoice: string;
    defaultSpeed: number;
    defaultPitch: number;
    defaultVolume: number;   
}

//discord server interface
export interface GuildSettingsDBInterface {
    id: number;
    guildId: string;
    prefix: string;    
}

//discord user settings interface
export interface MemberSettingsDBInterface {
    id: number;
    memberId: string;
    serviceID?: string;
    serviceName?: string;
    voice: string;
    speed: number;
    pitch: number;
    volume: number;
}
