import type { Readable as ReadableType } from 'stream';

const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const { Readable } = require('stream');
const { join } = require('path');
const { createAudioResource, StreamType } = require('@discordjs/voice');

// Find project root (where node_modules lives) by walking up from __dirname
const fs = require('fs');
const path = require('path');
let ffmpegRoot = __dirname;
while (ffmpegRoot !== path.parse(ffmpegRoot).root) {
    if (fs.existsSync(join(ffmpegRoot, 'node_modules'))) break;
    ffmpegRoot = path.dirname(ffmpegRoot);
}

const ffmpeg: any = createFFmpeg({
    corePath: join(ffmpegRoot, 'node_modules', '@ffmpeg', 'core', 'dist', 'ffmpeg-core.js'),
});

if (!ffmpeg.isLoaded()) {
    ffmpeg.load();
}

async function streamToBuffer(readableStream: ReadableType): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of readableStream) {
        chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
}

const mp3ToReadableOpusBuffer = async (mp3AudioStream: ReadableType): Promise<any> => {
    if (!ffmpeg.isLoaded()) {
        ffmpeg.load();
    }

    const audioBuffer = await streamToBuffer(mp3AudioStream);
    ffmpeg.FS('writeFile', 'input.mp3', new Uint8Array(audioBuffer));
    await ffmpeg.run('-i', 'input.mp3', '-c:a', 'libopus', 'output.opus');
    const outputBuffer: Uint8Array = ffmpeg.FS('readFile', 'output.opus');

    const outputReadableStream = new Readable({
        read() {
            this.push(new Uint8Array(outputBuffer));
            this.push(null);
        },
    });

    const resource = createAudioResource(outputReadableStream, {
        inputType: StreamType.OggOpus,
    });

    return resource;
};

module.exports = {
    mp3ToReadableOpusBuffer,
};
