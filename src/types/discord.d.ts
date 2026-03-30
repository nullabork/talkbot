import { Collection, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface SlashCommand {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    startup?: () => void;
    listeners?: Record<string, Function>;
    sequence?: { message?: number; token?: number };
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, SlashCommand>;
    }
}
