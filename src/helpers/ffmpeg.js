const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const { Readable } = require('stream');
const { join } = require('path');
const {
    joinVoiceChannel,
    createAudioResource,
    StreamType,
    createAudioPlayer,
    NoSubscriberBehavior,
  } = require('@discordjs/voice');

const ffmpeg = createFFmpeg({
    corePath: join(__dirname, '..','..', 'node_modules', '@ffmpeg', 'core', 'dist', 'ffmpeg-core.js'),
});

if (!ffmpeg.isLoaded()) {
    ffmpeg.load();
}

async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}



const mp3ToReadableOpusBuffer = async (mp3AudioStream) => {
    let i = 0;

    if (!ffmpeg.isLoaded()) {
        ffmpeg.load();
    }

    const audioBuffer = await streamToBuffer(mp3AudioStream);
    ffmpeg.FS('writeFile', 'input.mp3', new Uint8Array(audioBuffer));
    await ffmpeg.run('-i', 'input.mp3', '-c:a', 'libopus', 'output.opus');
    const outputBuffer = ffmpeg.FS('readFile', 'output.opus');

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
}


module.exports = {
    mp3ToReadableOpusBuffer
};