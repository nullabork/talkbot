import type { SSMLTagData } from '../types';

class SSMLTag {
    open: string | null;
    close: string | null;
    type: string | null;
    attributes: Record<string, string>;

    constructor(details?: Partial<SSMLTagData>) {
        this.open = null;
        this.close = null;
        this.type = null;
        this.attributes = {};
        Object.assign(this, details);
    }

    openString(): string {
        return '<' + this.type + ' ' + this.getAttributesString() + ' >';
    }

    closeString(): string {
        return '</' + this.type + '>';
    }

    getAttributesString(): string {
        let attrs = '';
        for (const key in this.attributes) {
            if (this.attributes.hasOwnProperty(key)) {
                const value = this.attributes[key];
                attrs += ' ' + key + '="' + value + '"';
            }
        }
        return attrs;
    }
}

module.exports = SSMLTag;
