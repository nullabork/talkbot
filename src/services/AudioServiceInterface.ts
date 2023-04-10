import { MemberSettingsDBInterface } from "@Database/DatabaseInterfaces";
import { Readable } from "stream";

export interface AudioServiceInterface {
    tranformInputText(text: string, memberSettings: MemberSettingsDBInterface): Promise<string>;
    getAudio(text: string, memberSettings: MemberSettingsDBInterface): Promise<Readable>;
}