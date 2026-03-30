import type { CommandListeners, ListenerCallback } from '../types';

const Common = require('@helpers/common');

class Command {
    private static instance: Command;

    [key: string]: unknown;

    static get command(): Command {
        return (this.instance = this.instance || new (this as any)());
    }

    get hidden(): boolean {
        return true;
    }

    get order(): number {
        return 99;
    }

    get command_name(): string {
        return this.constructor.name.toLowerCase();
    }

    get group(): string {
        return 'misc';
    }

    get short_help(): string {
        return `${this.command_name}.shorthelp`;
    }

    get long_help(): string {
        return `${this.command_name}.longhelp`;
    }

    get sequence(): { message: number; token: number } {
        return {
            message: 0,
            token: 0,
        };
    }

    execute(details: unknown, server: unknown, world: unknown): void {
        Common.out('Please implement the execute function');
    }

    get listeners(): CommandListeners {
        const self = this as any;
        return {
            message: self.onMessage || null,
            token: self.onToken || null,

            userJoinedChannel: self.onUserJoinedChannel || null,

            messageDelivered: self.onMessageDelivered || null,
            preValidate: self.onPreValidate || null,
            validate: self.onValidate || null,

            joinVoice: self.onJoinVoice || null,
            leaveVoice: self.onLeaveVoice || null,

            follow: self.onFollow || null,
            unfollow: self.onUnfollow || null,

            configureVoice: self.onConfigureVoice || null,
        };
    }
}

module.exports = Command;
