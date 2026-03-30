import * as path from 'path';
import * as fs from 'fs';

/**
 * Loads config/config.json from the project root.
 * Works both in development (src/) and production (dist/src/).
 * Resolves the project root by walking up from __dirname until we find package.json.
 */
function findProjectRoot(startDir: string): string {
    let dir = startDir;
    while (dir !== path.parse(dir).root) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    throw new Error('Could not find project root (no package.json found)');
}

const projectRoot = findProjectRoot(__dirname);

export const configPath = path.join(projectRoot, 'config');
export const botConfigPath = path.join(configPath, 'config.json');

let _botConfig: any = null;

export function getBotConfig(): any {
    if (!_botConfig) {
        if (!fs.existsSync(botConfigPath)) {
            console.error(`Config file not found: ${botConfigPath}`);
            console.error('Copy config/config.example.json to config/config.json and edit it.');
            process.exit(1);
        }
        _botConfig = JSON.parse(fs.readFileSync(botConfigPath, 'utf-8'));
    }
    return _botConfig;
}

export function loadJsonConfig(filename: string): any {
    const filePath = path.join(configPath, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Config file not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadLangJson(): any {
    const srcLang = path.join(projectRoot, 'src', 'lang.json');
    const distLang = path.join(projectRoot, 'dist', 'src', 'lang.json');
    // Try src/ first (dev), then dist/src/ (compiled)
    const langPath = fs.existsSync(srcLang) ? srcLang : distLang;
    const configLang = path.join(configPath, 'lang.json');
    const baseLang = fs.existsSync(langPath) ? JSON.parse(fs.readFileSync(langPath, 'utf-8')) : {};
    const overrideLang = fs.existsSync(configLang) ? JSON.parse(fs.readFileSync(configLang, 'utf-8')) : {};
    return Object.assign(baseLang, overrideLang);
}

// Default export for require() replacement — returns bot config
module.exports = getBotConfig();
module.exports.getBotConfig = getBotConfig;
module.exports.loadJsonConfig = loadJsonConfig;
module.exports.loadLangJson = loadLangJson;
module.exports.configPath = configPath;
module.exports.projectRoot = projectRoot;
