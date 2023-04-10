import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { join } from 'path';
import { Readable } from 'stream';

const ffmpeg = createFFmpeg({
    corePath: join(__dirname, '..','..', 'node_modules', '@ffmpeg', 'core', 'dist', 'ffmpeg-core.js'),
});

if (!ffmpeg.isLoaded()) {
    ffmpeg.load();
}

export const toBuffer = async (stream: Readable) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return new Uint8Array(Buffer.concat(chunks));
}

export const toReadable = async (buffer: Uint8Array) => {
    return new Readable({
        read() {
            this.push(buffer);
            this.push(null);
        },
    });
}

export const toOpus = async (buffer: Uint8Array, inputType = 'mp3') => {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    ffmpeg.FS('writeFile', `input.${inputType}`, buffer);
    await ffmpeg.run('-i', `input.${inputType}`, '-c:a', 'libopus', 'output.opus');
    return ffmpeg.FS('readFile', 'output.opus');
}

export const toMp3 = async (buffer: Uint8Array, inputType = 'opus') => {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    ffmpeg.FS('writeFile', `input.${inputType}`, buffer);
    await ffmpeg.run('-i', `input.${inputType}`, '-c:a', 'libmp3lame', 'output.mp3');
    return ffmpeg.FS('readFile', 'output.mp3');
}

export const toWav = async (buffer: Uint8Array, inputType = 'opus') => {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    ffmpeg.FS('writeFile', `input.${inputType}`, buffer);
    await ffmpeg.run('-i', `input.${inputType}`, '-c:a', 'pcm_s16le', 'output.wav');
    return ffmpeg.FS('readFile', 'output.wav');
}

export const mp3ToOpus = async (stream: Readable) => {
    const buffer = await toBuffer(stream);
    const opusbuffer = await toOpus(buffer);
    return await toReadable(opusbuffer);
}

export const opusToMp3 = async (stream: Readable) => {
    const buffer = await toBuffer(stream);
    const mp3buffer = await toMp3(buffer);
    return await toReadable(mp3buffer);
}

export const wavToOpus = async (stream: Readable) => {
    const buffer = await toBuffer(stream);
    const opusbuffer = await toOpus(buffer, 'wav');
    return await toReadable(opusbuffer);
}

export const opusToWav = async (stream: Readable) => {
    const buffer = await toBuffer(stream);
    const wavbuffer = await toWav(buffer);
    return await toReadable(wavbuffer);
}
