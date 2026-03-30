export {};

const ssmlConfig = require('@helpers/ssml-dictionary');
const commands: any = require('@commands');
const Common = require('@helpers/common');

class MessageSSML {
    raw: string;
    server: any;
    text: string;
    tagStack: any[];
    parser: any;

    constructor(text: string, opts: { server: unknown }, parser: any) {
        const find = ssmlConfig
            .map(function (tag: any) {
                return Common.escapeRegExp(tag.open) + '|' + Common.escapeRegExp(tag.close);
            })
            .join('|');
        this.raw = text;
        this.server = opts.server;
        this.text = text.replace(new RegExp('(' + find + ')', 'g'), ' $1 ');
        this.tagStack = [];
        this.parser = parser;
    }

    compile(token: string): string {
        token = token || '';

        if (commands.notify) {
            const alt = commands.notify('token', { token, server: this.server });
            if (alt) {
                return alt;
            }
        }

        const tag = MessageSSML.getRelatedTagInfo(token);
        const closing = this.tagsToClose(tag);
        if (tag) {
            if (!closing.length) {
                this.tagStack.push(tag);
                return tag.openString();
            } else {
                let close = '';
                closing.forEach(function (element: any) {
                    close += element.closeString();
                });
                return close;
            }
        }

        return token;
    }

    tagsToClose(find: any): any[] {
        const found: any[] = [];
        for (let i = 0; i < this.tagStack.length; i++) {
            const tag = this.tagStack[i];
            found.unshift(tag);

            if (find == tag) {
                this.tagStack = this.tagStack.slice(
                    (this.tagStack.length - i) - 1,
                    this.tagStack.length - 1,
                );

                return found;
            }
        }

        return [];
    }

    static getRelatedTagInfo(token: string): any {
        for (let i = 0; i < ssmlConfig.length; i++) {
            if (token == ssmlConfig[i].open || token == ssmlConfig[i].close) {
                return ssmlConfig[i];
            }
        }
        return null;
    }

    messageBuffer(): string {
        if (this.text.replace(/[^a-z0-9 ]*/ig, '').length < 30) {
            return '<break time="1000ms"/>';
        }
        return '';
    }

    build(): string {
        const compiled = this.parser.parse();

        this.tagStack.forEach(function (element: any) {
            compiled.push(element.closeString());
        });

        return '<speak>' + this.raw + '</speak>';
    }
}

module.exports = MessageSSML;
