import type { CommentBuilderData } from '../types';

const pad: (value: string, length: number) => string = require('pad');
const Common = require('@helpers/common');

class CommentBuilder {
    padding: string;
    formatKey: boolean;
    data: Record<string, unknown> | unknown[] | string;
    keyMap: Record<string, string>;

    constructor(data: CommentBuilderData) {
        this.padding = data.padding || ' ';
        this.formatKey = typeof data.formatKey != 'undefined' ? data.formatKey : true;
        this.data = data.data || {};
        this.keyMap = data.keyMap || {};
    }

    static create(data: CommentBuilderData): string {
        const builder = new CommentBuilder(data);
        return builder.out();
    }

    recurse(padding: string, data: any): string {
        let out = '';
        if (typeof data['_heading'] != 'undefined') {
            out += this.heading(padding, data['_heading']);
        }

        if (typeof data['_data'] != 'undefined') {
            data = data['_data'];
        }

        let max = 0;
        if (!Array.isArray(data) && typeof data != 'string') {
            for (const key in data) {
                if (typeof key == 'string' && key.length > max) {
                    max = key.length;
                }
            }
        }

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                let element = data[key];

                // is array ... recurse
                if (element != null && Array.isArray(element)) {
                    if (isNaN(parseInt(key)))
                        out += this.heading(padding, key);

                    out += this.recurse(padding + this.padding, element);
                }
                // is object .... recurse
                else if (element != null && typeof element == 'object') {
                    if (isNaN(parseInt(key)))
                        out += this.heading(padding, key);

                    out += this.recurse(padding + this.padding, element);
                }
                // is not either of the above :D do some cool stuff:D
                else {
                    element = '' + element;
                    out += this.row(padding, max, key, element);
                }
            }
        }

        return out;
    }

    row(padding: string, rightPad: number, key: string, value: string): string {
        if (isNaN(parseInt(key))) {
            if (this.keyMap && this.keyMap[key]) key = this.keyMap[key];

            return padding + pad(key, rightPad) + ' :: ' + value.trim() + '\n';
        } else {
            return padding + value + '\n';
        }
    }

    arrayRow(padding: string, value: string): string {
        return padding + value + '\n';
    }

    heading(padding: string, value: string): string {
        if (this.formatKey) value = Common.camelize(value);
        return '\n' + '= ' + value + ' =\n';
    }

    out(): string {
        return '```asciidoc\n' + this.recurse('', this.data) + '```';
    }
}

module.exports = CommentBuilder;
