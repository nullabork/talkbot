import type { BotCommandData, CommandListeners } from '../types';

class BotCommand {
    command_name: string | null;
    command_arg: string | null;
    startup: (() => void) | null;
    short_help: string | null;
    long_help: string | null;
    hidden: boolean;
    listeners: Partial<Record<string, ((...args: unknown[]) => unknown) | null>>;
    order: number;
    sequence: { message: number; token: number };

    constructor(client_data?: Partial<BotCommandData>) {
        this.command_name = null;
        this.command_arg = null;
        this.startup = null;
        this.short_help = null;
        this.long_help = null;
        this.hidden = false;
        this.listeners = {};
        this.order = 99;
        this.sequence = {
            message: 0,
            token: 0,
        };

        if (client_data) {
            Object.assign(this, client_data);
        }
    }

    // stub bogus function to prevent bogusness
    execute(..._args: unknown[]): void {
        // stub
    }
}

module.exports = BotCommand;
