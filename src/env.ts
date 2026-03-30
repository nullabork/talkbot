import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment variable schema.
 * Validates and types all env vars at startup.
 * Secrets that were previously in config files are now loaded from .env.
 *
 * Only DISCORD_TOKEN and CLIENT_ID are required — TTS provider keys are optional
 * since not every installation uses every provider.
 */
const envSchema = z.object({
    // Discord
    DISCORD_TOKEN: z.string().optional(),
    CLIENT_ID: z.string().optional(),

    // Developer user IDs (comma-separated Discord snowflakes)
    DEV_IDS: z.string().optional(),
    // Support server ID
    SUPPORT_SERVER_ID: z.string().optional(),

    // Google Cloud TTS
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

    // Amazon Polly TTS
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),

    // Azure Cognitive Services TTS
    AZURE_SUBSCRIPTION_KEY: z.string().optional(),
    AZURE_ENDPOINT: z.string().optional(),

    // IBM Watson TTS
    WATSON_API_KEY: z.string().optional(),
    WATSON_SERVICE_URL: z.string().optional(),

    // Tencent Cloud TTS
    TENCENT_ACCESS_KEY_ID: z.string().optional(),
    TENCENT_SECRET_ACCESS_KEY: z.string().optional(),

    // Alibaba Cloud TTS
    ALIBABA_APP_KEY: z.string().optional(),
    ALIBABA_TOKEN: z.string().optional(),
    ALIBABA_ENDPOINT: z.string().optional(),

    // Application
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // Bot behaviour (previously in config/config.json)
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

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    process.exit(1);
}

export const env = result.data;
export type Env = z.infer<typeof envSchema>;
