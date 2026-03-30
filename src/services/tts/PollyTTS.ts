import type { AWSPollyVoice, PollyTTSOptions } from '@src/types';
import type { IncomingMessage } from 'http';

const https = require('https');
const querystring = require('querystring');
const aws4 = require('aws4');

interface PollyCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
}

interface DescribeVoicesResponse {
    Voices: AWSPollyVoice[];
}

class PollyTTS {
    private credentials: PollyCredentials;

    constructor(credentials: PollyCredentials) {
        this.credentials = credentials;
    }

    async describeVoices(): Promise<DescribeVoicesResponse> {
        return new Promise((resolve, reject) => {
            const opts = {
                service: 'polly',
                region: 'eu-west-1',
                path: '/v1/voices?',
                signQuery: true,
            };

            aws4.sign(opts, this.credentials);
            https
                .get(opts, (res: IncomingMessage) => {
                    if (res.statusCode !== 200) {
                        reject(`Request Failed. Status Code: ${res.statusCode}`);
                    } else {
                        let body = '';

                        res.on('data', (chunk: string) => {
                            body += chunk;
                        });

                        res.on('end', () => {
                            try {
                                const json = JSON.parse(body);
                                resolve(json);
                            } catch (error: any) {
                                reject(error.message);
                            }
                        });
                    }
                })
                .on('error', reject);
        });
    }

    async textToSpeech(options: PollyTTSOptions): Promise<IncomingMessage> {
        return new Promise((resolve, reject) => {
            if (!options) {
                reject('Options are missing');
                return;
            }
            const qs: Record<string, string | number> = {
                Text: options.text,
                TextType: options.textType || 'text',
                VoiceId: options.voiceId || 'Vicki',
                SampleRate: options.sampleRate || 22050,
                OutputFormat: options.outputFormat || 'mp3',
            };
            const opts = {
                service: 'polly',
                region: options.region || 'eu-west-1',
                path: '/v1/speech?' + querystring.stringify(qs),
                signQuery: true,
            };

            aws4.sign(opts, this.credentials);
            https
                .get(opts, (res: IncomingMessage) => {
                    if (res.statusCode !== 200) {
                        reject(`Request Failed. Status Code: ${res.statusCode}`);
                    } else {
                        resolve(res);
                    }
                })
                .on('error', reject);
        });
    }
}

module.exports = PollyTTS;
