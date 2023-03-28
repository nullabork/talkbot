const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const { Readable } = require('stream');

const ffmpeg = createFFmpeg({
    //absolute path to relative file node_modules\@ffmpeg\core\dist\ffmpeg-core.js
    corePath: 'C:\\Users\\aaron\\Projects\\talkbot\\core\\dist\\ffmpeg-core.js',
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



const mp3ToAutoBuffer = async (mp3AudioStream) => {

    const audioBuffer = await streamToBuffer(audio.AudioStream);

    // Ensure ffmpeg is ready
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    // Transcode audio to a format suitable for Discord
    ffmpeg.FS('writeFile', 'input.mp3', new Uint8Array(audioBuffer));
    await ffmpeg.run('-i', 'input.mp3', '-c:a', 'libopus', 'output.opus');
    const outputBuffer = ffmpeg.FS('readFile', 'output.opus');

    const outputReadableStream = new Readable({
        read() {
            this.push(new Uint8Array(outputBuffer));
            this.push(null);
        },
    });

    return outputReadableStream;
}


module.exports = {
    mp3ToAutoBuffer
};