import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/index.ts'],
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            '@helpers': path.resolve(__dirname, 'src/helpers'),
            '@models': path.resolve(__dirname, 'src/models'),
            '@commands': path.resolve(__dirname, 'src/commands'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@tts': path.resolve(__dirname, 'src/services/tts'),
            '@config': path.resolve(__dirname, 'config'),
            '@botconfig': path.resolve(__dirname, 'config/config.json'),
            '@paths': path.resolve(__dirname, 'src/paths'),
            '@src': path.resolve(__dirname, 'src'),
        },
    },
});
