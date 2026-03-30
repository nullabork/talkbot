export {};

import { env } from '../env';
const util = require('util');

class Common {
    // clean string so its usable in RegExp
    static escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static isURL(url: string): boolean {
        if (url.length < 4) return false;
        if (url.substring(0, 4) == 'http') return true;
        return false;
    }

    static out(message: unknown): void {
        if (!message) message = 'null';
        if (typeof message == 'object' && (message as Error).stack) {
            message = (message as Error).stack;
        }

        if (env.LOG_OUTPUT === 'true') {
            console.log(
                new Date().toISOString() +
                    ' ' +
                    message +
                    ((message as string).indexOf && (message as string).indexOf('\n') > -1 ? '\n' : ''),
            );
        }
    }

    static error(message: unknown): void {
        if (!message) message = 'null';
        if (typeof message == 'object' && (message as Error).stack) {
            message = (message as Error).stack;
        } else if (typeof message == 'object') {
            message = util.inspect(message);
        }

        if (env.LOG_ERRORS === 'true') {
            console.error(
                new Date().toISOString() +
                    ' ' +
                    message +
                    ((message as string).indexOf && (message as string).indexOf('\n') > -1 ? '\n' : ''),
            );
        }
    }

    static isMessageExcluded(message: string): boolean {
        return message.startsWith('```');
    }

    static numberClamp(number: number, min: number, max: number): number {
        return Math.min(Math.max(number, min), max);
    }

    static hashCode(s: string): number {
        let h = 0;
        for (let i = 0; i < s.length; i++)
            h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
        return h;
    }

    static numberMap(n: number = 0, r1: number = 0, r2: number = 1, m1: number = 0, m2: number = 100): number {
        n = Common.numberClamp(n, r1, r2);
        return ((n - r1) / (r2 - r1)) * (m2 - m1) + m1;
    }

    static scaleToRange(num: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
        const number = Common.numberClamp(num, in_min, in_max);
        return (
            ((number - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
        );
    }

    static caseToSpace(nick_name: string): string {
        if (!nick_name) return '';
        return nick_name.replace(/([a-z])([A-Z])/g, function (_a: string, b: string, c: string) {
            return b + ' ' + c;
        });
    }

    static replaceLast(str: string, strToReplace: string, replacement: string): string {
        const pos = str.lastIndexOf(strToReplace);
        if (pos < 0) return str;
        return (
            str.substring(0, pos) +
            replacement +
            str.substring(pos + strToReplace.length)
        );
    }

    static arg(): { name: string; value: string } {
        return {
            name: '',
            value: '',
        };
    }

    static camelize(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/-|_/g, ' ')
            .toLowerCase()
            .replace(/\b[a-z]/g, function (b: string) {
                return b.toUpperCase();
            });
    }

    static removeUrls(message: string, fn?: string | ((match: string) => string)): string {
        return message.replace(/https*:\/\/\S*/g, fn ? fn as any : '');
    }

    static removeRepeatingChar(message: string): string {
        const maxChars = 6;
        const a = message.split('');
        const leaveOneRemaining = true;
        const thresholdToStartStriping = maxChars;

        let lastletter = '';
        let stripLength = leaveOneRemaining ? 0 : 1;
        for (let i = a.length; i > 0; i--) {
            const letter = a[i - 1];

            if (lastletter == letter) {
                stripLength++;
            } else if (stripLength > thresholdToStartStriping) {
                a.splice(i, stripLength);
                stripLength = leaveOneRemaining ? 0 : 1;
            } else {
                stripLength = leaveOneRemaining ? 0 : 1;
            }
            lastletter = letter;
        }

        return a.join('');
    }

    static removeNullsChars(message: string): string {
        return message.replace(/\n|\r/gi, '');
    }

    static truncateMessage(message: string): string {
        if (message.length > 2000) {
            message = message.substring(0, 2000);
        }
        return message;
    }

    static cleanMessage(message: string): string {
        message = message.trim();
        message = Common.removeUrls(message);
        message = Common.removeRepeatingChar(message);
        message = Common.removeNullsChars(message);
        message = Common.truncateMessage(message);
        return message;
    }

    static makeCsv(collection: any, selector: (item: any) => string): string {
        let csv = '';
        if (collection.size == 0) return '';
        collection.forEach((item: any) => {
            csv += selector(item) + ', ';
        });
        csv = csv.substring(0, csv.length - 2);

        return csv;
    }

    static makeNiceCsv(collection: any, selector: (item: any) => string): string {
        return Common.replaceLast(
            Common.makeCsv(collection, selector),
            ', ',
            ' and ',
        );
    }

    static makeAudioSSML(url: string): string {
        const ssml = '<audio src=\'' + url + '\' />';
        return ssml;
    }
}

module.exports = Common;
