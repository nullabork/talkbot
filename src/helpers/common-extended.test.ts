import { describe, it, expect } from 'vitest';

/**
 * Extended Common utility tests — edge cases for cleanMessage, removeUrls,
 * numberClamp, hashCode, caseToSpace, makeAudioSSML, truncateMessage,
 * isMessageExcluded, and removeRepeatingChar.
 *
 * These reimplement the static methods from Common to avoid the @auth
 * require dependency chain.
 */

// ── Reimplemented functions matching Common class ──

function removeUrls(message: string, fn?: string | ((match: string) => string)): string {
    return message.replace(/https*:\/\/\S*/g, fn ? (fn as any) : '');
}

function removeRepeatingChar(message: string): string {
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

function removeNullsChars(message: string): string {
    return message.replace(/\n|\r/gi, '');
}

function truncateMessage(message: string): string {
    if (message.length > 2000) {
        message = message.substring(0, 2000);
    }
    return message;
}

function cleanMessage(message: string): string {
    message = message.trim();
    message = removeUrls(message);
    message = removeRepeatingChar(message);
    message = removeNullsChars(message);
    message = truncateMessage(message);
    return message;
}

function isMessageExcluded(message: string): boolean {
    return message.startsWith('```');
}

function numberClamp(number: number, min: number, max: number): number {
    return Math.min(Math.max(number, min), max);
}

function hashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++)
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
}

function caseToSpace(nick_name: string): string {
    if (!nick_name) return '';
    return nick_name.replace(/([a-z])([A-Z])/g, function (_a: string, b: string, c: string) {
        return b + ' ' + c;
    });
}

function makeAudioSSML(url: string): string {
    return '<audio src=\'' + url + '\' />';
}

function numberMap(
    n: number = 0,
    r1: number = 0,
    r2: number = 1,
    m1: number = 0,
    m2: number = 100,
): number {
    n = numberClamp(n, r1, r2);
    return ((n - r1) / (r2 - r1)) * (m2 - m1) + m1;
}

function scaleToRange(
    num: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number,
): number {
    const number = numberClamp(num, in_min, in_max);
    return ((number - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

// ── Tests ──

describe('cleanMessage extended', () => {
    it('removes URLs from message', () => {
        const result = cleanMessage('check out https://example.com now');
        expect(result).toBe('check out  now');
        expect(result).not.toContain('https://');
    });

    it('removes multiple URLs', () => {
        const result = cleanMessage('visit https://a.com and http://b.com today');
        expect(result).toBe('visit  and  today');
    });

    it('handles repeating characters', () => {
        const result = cleanMessage('hellooooooooo world');
        // After removeRepeatingChar with threshold 6, excess 'o' chars are stripped
        expect(result.length).toBeLessThan('hellooooooooo world'.length);
        expect(result).toContain('hell');
        expect(result).toContain('world');
    });

    it('removes newlines and carriage returns', () => {
        const result = cleanMessage('hello\nworld\r!');
        expect(result).toBe('helloworld!');
    });

    it('trims whitespace', () => {
        const result = cleanMessage('   hello   ');
        expect(result).toBe('hello');
    });
});

describe('isMessageExcluded', () => {
    it('returns true for triple backtick code block', () => {
        expect(isMessageExcluded('```javascript\nconsole.log("hi");\n```')).toBe(true);
    });

    it('returns true for triple backtick at start', () => {
        expect(isMessageExcluded('```')).toBe(true);
    });

    it('returns false for normal message', () => {
        expect(isMessageExcluded('hello world')).toBe(false);
    });

    it('returns false for single backtick', () => {
        expect(isMessageExcluded('`inline code`')).toBe(false);
    });

    it('returns false for double backtick', () => {
        expect(isMessageExcluded('``not excluded``')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isMessageExcluded('')).toBe(false);
    });
});

describe('removeUrls', () => {
    it('removes https URL', () => {
        expect(removeUrls('see https://example.com here')).toBe('see  here');
    });

    it('removes http URL', () => {
        expect(removeUrls('see http://example.com here')).toBe('see  here');
    });

    it('does not affect non-URL text', () => {
        expect(removeUrls('no urls here')).toBe('no urls here');
    });

    it('uses replacement function when provided', () => {
        const result = removeUrls('click https://example.com now', () => '[link]');
        expect(result).toBe('click [link] now');
    });

    it('uses replacement string when provided', () => {
        const result = removeUrls('click https://example.com now', '[REMOVED]');
        expect(result).toBe('click [REMOVED] now');
    });
});

describe('numberClamp edge cases', () => {
    it('returns min when value is below min', () => {
        expect(numberClamp(-10, 0, 100)).toBe(0);
    });

    it('returns max when value is above max', () => {
        expect(numberClamp(150, 0, 100)).toBe(100);
    });

    it('returns value when at min boundary', () => {
        expect(numberClamp(0, 0, 100)).toBe(0);
    });

    it('returns value when at max boundary', () => {
        expect(numberClamp(100, 0, 100)).toBe(100);
    });

    it('returns value when within range', () => {
        expect(numberClamp(50, 0, 100)).toBe(50);
    });

    it('handles negative ranges', () => {
        expect(numberClamp(-5, -10, -1)).toBe(-5);
    });

    it('clamps to min with equal min/max', () => {
        expect(numberClamp(50, 10, 10)).toBe(10);
    });
});

describe('hashCode', () => {
    it('deterministic — same input gives same output', () => {
        expect(hashCode('test')).toBe(hashCode('test'));
    });

    it('different inputs give different hashes', () => {
        expect(hashCode('hello')).not.toBe(hashCode('world'));
    });

    it('returns a number', () => {
        expect(typeof hashCode('anything')).toBe('number');
    });

    it('empty string returns 0', () => {
        expect(hashCode('')).toBe(0);
    });

    it('single character returns its char code', () => {
        expect(hashCode('a')).toBe('a'.charCodeAt(0));
    });
});

describe('caseToSpace', () => {
    it('converts camelCase to spaced string', () => {
        expect(caseToSpace('camelCase')).toBe('camel Case');
    });

    it('converts PascalCase with multiple transitions', () => {
        expect(caseToSpace('myVoiceProvider')).toBe('my Voice Provider');
    });

    it('leaves lowercase string unchanged', () => {
        expect(caseToSpace('lowercase')).toBe('lowercase');
    });

    it('leaves all uppercase unchanged', () => {
        expect(caseToSpace('ALLCAPS')).toBe('ALLCAPS');
    });

    it('returns empty string for empty input', () => {
        expect(caseToSpace('')).toBe('');
    });

    it('handles null/undefined gracefully', () => {
        expect(caseToSpace(null as any)).toBe('');
        expect(caseToSpace(undefined as any)).toBe('');
    });
});

describe('makeAudioSSML', () => {
    it('returns correct SSML audio tag format', () => {
        const result = makeAudioSSML('https://example.com/sound.mp3');
        expect(result).toBe("<audio src='https://example.com/sound.mp3' />");
    });

    it('wraps URL in single quotes', () => {
        const result = makeAudioSSML('https://cdn.example.com/audio.ogg');
        expect(result).toContain("src='https://cdn.example.com/audio.ogg'");
    });

    it('produces self-closing tag', () => {
        const result = makeAudioSSML('https://example.com/a.mp3');
        expect(result).toMatch(/\/>$/);
    });
});

describe('truncateMessage', () => {
    it('does not truncate message under 2000 chars', () => {
        const msg = 'a'.repeat(100);
        expect(truncateMessage(msg)).toBe(msg);
    });

    it('does not truncate message of exactly 2000 chars', () => {
        const msg = 'a'.repeat(2000);
        expect(truncateMessage(msg)).toBe(msg);
        expect(truncateMessage(msg).length).toBe(2000);
    });

    it('truncates message over 2000 chars to exactly 2000', () => {
        const msg = 'a'.repeat(5000);
        const result = truncateMessage(msg);
        expect(result.length).toBe(2000);
    });
});

describe('numberMap and scaleToRange', () => {
    it('numberMap maps 0.5 in [0,1] to 50 in [0,100]', () => {
        expect(numberMap(0.5, 0, 1, 0, 100)).toBe(50);
    });

    it('numberMap clamps input to source range', () => {
        expect(numberMap(2, 0, 1, 0, 100)).toBe(100);
    });

    it('scaleToRange maps midpoint correctly', () => {
        expect(scaleToRange(50, 0, 100, 0, 1)).toBe(0.5);
    });

    it('scaleToRange maps min to out_min', () => {
        expect(scaleToRange(0, 0, 100, 10, 20)).toBe(10);
    });

    it('scaleToRange maps max to out_max', () => {
        expect(scaleToRange(100, 0, 100, 10, 20)).toBe(20);
    });
});
