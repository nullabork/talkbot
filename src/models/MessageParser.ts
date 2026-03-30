export {};

class MessageParser {
    text: string;
    compiled: string[];
    index: number;

    constructor(text: string) {
        this.text = text;
        this.compiled = [];
        this.index = 0;
    }

    tokensRemaining(): boolean {
        return this.index < this.text.length;
    }

    nextToken(): string | null {
        if (!this.tokensRemaining()) {
            return null;
        }

        let token = '';
        let char = this.text.charAt(this.index);

        if (/\s/.test(char)) {
            this.index++;
            return this.nextToken();
        }

        while (/\S/.test(char) && this.tokensRemaining()) {
            token += char;
            char = this.text.charAt(++this.index);
        }
        return token;
    }

    compile(token: string): string {
        return token;
    }

    parse(): string[] {
        let token: string | null;
        while (token = this.nextToken()) {
            if (typeof this.compile == 'function') {
                const modified = this.compile.apply(this, [token]);
                if (modified) token = modified;
                this.compiled.push(modified);
            }
        }

        return this.compiled;
    }
}

module.exports = MessageParser;
