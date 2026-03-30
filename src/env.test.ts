import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the schema from env.ts so we can test it directly
// without triggering the process.exit() on failure
const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
    CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
    DEV_IDS: z.string().optional(),
    SUPPORT_SERVER_ID: z.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    AZURE_SUBSCRIPTION_KEY: z.string().optional(),
    AZURE_ENDPOINT: z.string().optional(),
    WATSON_API_KEY: z.string().optional(),
    WATSON_SERVICE_URL: z.string().optional(),
    TENCENT_ACCESS_KEY_ID: z.string().optional(),
    TENCENT_SECRET_ACCESS_KEY: z.string().optional(),
    ALIBABA_APP_KEY: z.string().optional(),
    ALIBABA_TOKEN: z.string().optional(),
    ALIBABA_ENDPOINT: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    COMMAND_CHAR: z.string().default('!'),
    TAGLINE: z.string().default(''),
    ADVERTISE_STREAMER: z.string().default(''),
    PESTER_THRESHOLD: z.coerce.number().default(10000000),
    TWITCH_AUDIO_QUEUE_LIMIT: z.coerce.number().default(10),
    LOG_ERRORS: z.string().default('true'),
    LOG_OUTPUT: z.string().default('true'),
    NEGLECT_TIMEOUT: z.coerce.number().default(3600000),
    NEGLECT_TIMEOUT_MESSAGES: z.string().default('Talkbot inactivity timeout'),
    DEFAULT_TITLE: z.string().default('master'),
});

describe('env', () => {
    it('should export env with required fields when valid .env exists', async () => {
        // env.ts validates on import — if we get here, it parsed successfully
        const { env } = await import('./env');
        expect(env).toBeDefined();
        expect(env.DISCORD_TOKEN).toBeDefined();
        expect(env.CLIENT_ID).toBeDefined();
    });

    it('should have correct defaults for optional fields', async () => {
        const { env } = await import('./env');
        // Vitest sets NODE_ENV=test, so check it's a valid enum value
        expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
        expect(env.LOG_LEVEL).toBe('info');
        expect(env.AWS_REGION).toBe('us-east-1');
    });

    it('should leave optional TTS keys as undefined when not set', async () => {
        const { env } = await import('./env');
        // These are optional — undefined is valid
        expect(env.AZURE_SUBSCRIPTION_KEY).toBeUndefined();
        expect(env.WATSON_API_KEY).toBeUndefined();
    });
});

describe('env schema validation failures', () => {
    it('missing DISCORD_TOKEN causes validation error', () => {
        const result = envSchema.safeParse({
            CLIENT_ID: 'some-client-id',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const fields = result.error.flatten().fieldErrors;
            expect(fields.DISCORD_TOKEN).toBeDefined();
        }
    });

    it('missing CLIENT_ID causes validation error', () => {
        const result = envSchema.safeParse({
            DISCORD_TOKEN: 'some-token',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const fields = result.error.flatten().fieldErrors;
            expect(fields.CLIENT_ID).toBeDefined();
        }
    });

    it('invalid NODE_ENV causes validation error', () => {
        const result = envSchema.safeParse({
            DISCORD_TOKEN: 'some-token',
            CLIENT_ID: 'some-client-id',
            NODE_ENV: 'staging',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const fields = result.error.flatten().fieldErrors;
            expect(fields.NODE_ENV).toBeDefined();
        }
    });

    it('empty string DISCORD_TOKEN fails', () => {
        const result = envSchema.safeParse({
            DISCORD_TOKEN: '',
            CLIENT_ID: 'some-client-id',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const fields = result.error.flatten().fieldErrors;
            expect(fields.DISCORD_TOKEN).toBeDefined();
        }
    });

    it('valid input with all required fields passes', () => {
        const result = envSchema.safeParse({
            DISCORD_TOKEN: 'test-token',
            CLIENT_ID: 'test-client-id',
        });
        expect(result.success).toBe(true);
    });

    it('empty string CLIENT_ID fails', () => {
        const result = envSchema.safeParse({
            DISCORD_TOKEN: 'some-token',
            CLIENT_ID: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const fields = result.error.flatten().fieldErrors;
            expect(fields.CLIENT_ID).toBeDefined();
        }
    });

    it('invalid LOG_LEVEL causes validation error', () => {
        const result = envSchema.safeParse({
            DISCORD_TOKEN: 'some-token',
            CLIENT_ID: 'some-client-id',
            LOG_LEVEL: 'verbose',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const fields = result.error.flatten().fieldErrors;
            expect(fields.LOG_LEVEL).toBeDefined();
        }
    });
});
