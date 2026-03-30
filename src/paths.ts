import type { Paths } from './types';

const path = require('path');
const fs = require('fs');

// Find project root by walking up from __dirname until package.json is found.
// Works both from src/ (dev) and dist/src/ (compiled).
function findRoot(startDir: string): string {
    let d = startDir;
    while (d !== path.parse(d).root) {
        if (fs.existsSync(path.join(d, 'package.json'))) return d;
        d = path.dirname(d);
    }
    // Fallback: pop one level from __dirname (original behavior)
    const split: string[] = startDir.split(path.sep);
    split.pop();
    return split.join(path.sep);
}

const projectRoot: string = findRoot(__dirname);

// Determine the src base: use __dirname's parent to find the actual src location.
// When running from src/ (dev): __dirname = <root>/src → srcBase = <root>/src
// When running from dist/src/ (compiled): __dirname = <root>/dist/src → srcBase = <root>/dist/src
const srcBase: string = path.dirname(__dirname) === projectRoot
    ? path.join(projectRoot, 'src')           // __dirname IS src/
    : path.resolve(__dirname, '..');          // __dirname is inside src/ subfolder — go up one

// Actually simpler: __dirname for this file is always the "src" equivalent directory.
// paths.ts lives in src/, compiled to dist/src/paths.js. So __dirname IS the src base.
const srcDir: string = __dirname;

function join(a: string, b: string): string {
    return path.resolve(a, b);
}

function makeConfig(a: string): string {
    return path.resolve(projectRoot, a);
}

function makeSrc(a: string): string {
    return path.resolve(srcDir, a);
}

function include(this: typeof paths, aliased_path: string): unknown {
    const a = aliased_path.match(/^@([^@\\/]*)[\\/]{0,1}(.*)/);
    if (a && a.length) {
        const alias = a[1] as keyof typeof paths;
        const shortPath = a[2];

        if (paths[alias]) {
            const expandedPath = path.resolve(paths[alias], shortPath);
            return require(expandedPath);
        }
    }

    return null;
}

const paths: Paths = {
    state: makeConfig('config/state.json'),
    botConfig: makeConfig('config/config.json'),

    config: makeConfig('config'),
    src: srcDir,
    helpers: makeSrc('helpers'),
    commands: makeSrc('commands'),
    models: makeSrc('models'),
    services: makeSrc('services'),
    tts: makeSrc('services/tts'),

    join: join,
    resolve: join,
    require: include,
};

module.exports = paths;
