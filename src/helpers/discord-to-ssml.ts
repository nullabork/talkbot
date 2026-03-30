export {};

const Common = require('@helpers/common');

interface DiscordToSSMLConfig {
    minLength: number;
    minLengthBuff: string;
    tags: DiscordToSSMLTag[];
}

interface DiscordToSSMLTag {
    tags: string[];
    ssml: string;
    attr: string;
}

declare global {
    interface String {
        reverse(): string;
    }
}

String.prototype.reverse = function (this: string): string {
    const splitString = this.split('');
    const reverseArray = splitString.reverse();
    const joinArray = reverseArray.join('');
    return joinArray;
};

class DiscordToSSML {
    config: DiscordToSSMLConfig;
    tags: DiscordToSSMLTag[];

    constructor(config?: Partial<DiscordToSSMLConfig>) {
        this.config = {
            minLength: 20,
            minLengthBuff: '15000ms',
            tags: [],
        };

        Object.assign(this.config, config);

        this.tags = [];
        this.tags = this.tags.concat(this.tags);
    }

    addBuffer(message: string): string {
        if (message.length < this.config.minLength) {
            message =
                message + '<break time="' + this.config.minLengthBuff + '"/> ';
        }
        return message;
    }

    build(message: string): string {
        this.tags.forEach(function (tag: DiscordToSSMLTag) {
            if (tag.tags.length == 1) {
                const open = Common.escapeRegExp(tag.tags[0]);
                const regex = new RegExp(open, 'g');
                message = message.replace(regex, function () {
                    return '<' + tag.ssml + ' ' + tag.attr + '/>';
                });
            }

            if (tag.tags.length == 2) {
                const open = Common.escapeRegExp(tag.tags[0]);
                const close = Common.escapeRegExp(tag.tags[1]);
                const openRegex = new RegExp(open, 'g');
                const closeRegex = new RegExp(close, 'g');

                if (open == close) {
                    const matches = message.match(openRegex) || [];

                    if (!matches || !matches.length || matches.length % 2) {
                        return;
                    }
                }

                const openMatches = message.match(openRegex) || [];
                const closeMatches = message.match(closeRegex) || [];
                if (
                    openMatches.length != closeMatches.length ||
                    !openMatches.length ||
                    !closeMatches
                ) {
                    return;
                }

                message = message.replace(openRegex, function () {
                    return '<' + tag.ssml + ' ' + tag.attr + '>';
                });

                message = message.replace(closeRegex, function () {
                    return '</' + tag.ssml + '>';
                });
            }
        });

        message = this.addBuffer(message);
        message = '<speak>' + message + '</speak>';
        return message;
    }
}

module.exports = DiscordToSSML;
