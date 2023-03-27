/*jshint esversion: 9 */
// class for all the details of a command
const Common = require('@helpers/common'),
    auth = require('@auth') /*
  lame = require("@suldashi/lame"),
  samplerate = require("node-libsamplerate"),*/,
    prism = require('prism-media'),
    ssmlvalid = require('ssml-validator'),
    TextToSpeechService = require('@services/TextToSpeechService'),
    MessageSSML = require('@models/MessageSSML'),
    polly = require('@services/tts/PollyTTS.js');

class AmazonTextToSpeechAPI extends TextToSpeechService {
    // name of the service - eg. google, amazon, azure, watson
    get shortname() {
        return 'amazon';
    }

    // is this API enabled
    get enabled() {
        return auth.tts && auth.tts.amazon && auth.tts.amazon.enabled; // turn if off by not specifying it in the tts object
    }

    // get the char limit for this service
    get limit() {
        return auth.tts.amazon.limit;
    }

    // i know this is PCM and we're using ogg_vorbis with play stream, but it doesn't work if I switch to ogg
    // google works fine!
    get format() {
        return 'opus';
    }

    get rate() {
        return 22050;
    }

    /**
     * [startupTests to check things this API needs to operate]
     *
     * Should exit the process if this is not configured correctly
     */
    async startupTests() {
        const accessKeyId = auth.tts.amazon.accessKeyId;
        const secretAccessKey = auth.tts.amazon.secretAccessKey;
        const region = auth.tts.amazon.region;

        if (!secretAccessKey || !accessKeyId) {
            console.log('Config variable tts.amazon.accessKeyId or tts.amazon.secretAccessKey is not set.');
            process.exit(1);
        }

        try {
            AmazonTextToSpeechAPI.polly = new polly({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                region: region || 'us-east-1',
            });
            AmazonTextToSpeechAPI.voices = await AmazonTextToSpeechAPI.buildVoices();
        } catch (err) {
            console.log(`Something went wrong: ${err}`);
            process.exit(1);
        }
        console.log('Loaded the Amazon TTS API credentials OK.');
    }

    /**
     * [buildRequest to the underlying API]
     *
     * @param {*} ssml
     * @param {*} settings
     *
     * @return  {[type]}  [return request object for this API]
     */
    buildRequest(msg, settings, server) {
        if (!settings['amazon-xml-encode-disabled']) msg = ssmlvalid.correct(msg);
        if (!settings['amazon-breaths-disabled'])
            msg = '<amazon:auto-breaths>' + msg + '</amazon:auto-breaths>';

        var ssml = new MessageSSML(msg, { server: server }).build();
        var self = this;
        let options = {
            text: ssml, // if textType is ssml, than here needs to be the ssml string
            textType: 'ssml', // marks if it is ssml, text etc. - optional
            voiceId: settings.name || self.getDefaultVoice('FEMALE', 'en-US'), // Polly Voice -> also determines the language - optional settings.voice ||
            //outputFormat: "mp3", // all polly output formats like mp3, pcm etc. - optional
            outputFormat: 'ogg',
            sampleRate: self.rate, // use default unless PCM
        };

        return options;
    }

    /**
     * [getAudioContent from the underlying API]
     *
     * @param {*} request
     * @param {*} callback (err, audio) => {...}
     */
    async getAudioContent(request, callback) {
        var self = this;

        self.doBookkeeping(request);
        try {
            let audioStream = await AmazonTextToSpeechAPI.polly.textToSpeech(request);
            var ld = new lame.Decoder({
                sampleRate: 22050,
                channels: lame.MONO,
                signed: true,
                float: false,
                bitDepth: 16,
            });

            var resample = new samplerate({
                // Value can be from 0 to 4 or using enum. 0 is the best quality and the slowest.
                type: samplerate.SRC_SINC_MEDIUM_QUALITY,
                // Stereo
                channels: 1,
                // Sample rate of source
                fromRate: 22050,
                // bit depth of source. Valid values: 16 or 32
                fromDepth: 16,
                // Desired sample rate
                toRate: 48000,
                // Desired bit depth. Valid values: 16 or 32
                toDepth: 16,
            });

            callback(
                null,
                audioStream
                    .pipe(ld)
                    .pipe(resample)
                    .pipe(new prism.opus.Encoder({ rate: 48000, channels: 1, frameSize: 960 })),
            );
        } catch (err) {
            Common.error(request);
            Common.error(err);
            callback(new Error(err), null);
            return;
        }
    }

    getVoices() {
        return AmazonTextToSpeechAPI.voices;
    }

    getDefaultVoice(gender, lang_code) {
        var voices = AmazonTextToSpeechAPI.voices.filter(
            (voice) => voice.code == lang_code && voice.gender == gender,
        );
        if (voices.length > 0) return voices[0].voice;
        var voices = AmazonTextToSpeechAPI.voices.filter((voice) => voice.code == lang_code);
        if (voices.length > 0) return voices[0].voice;
        var voices = AmazonTextToSpeechAPI.voices.filter(
            (voice) => voice.code == 'en-US' && voice.gender == gender,
        );
        if (voices.length > 0) return voices[0].voice;
        return 'Kimberly';
    }

    getRandomVoice(randnum, gender, lang_code) {
        if (!randnum) randnum = Math.random() * 1000000;
        var voices = AmazonTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code == lang_code) && (!gender || voice.gender == gender),
        );

        return voices[randnum % voices.length].voice;
    }

    doBookkeeping(request) {
        if (!AmazonTextToSpeechAPI.count) AmazonTextToSpeechAPI.count = 0;
        AmazonTextToSpeechAPI.count += request.text.length;

        if (auth.tts.amazon.enforce_limit && AmazonTextToSpeechAPI.count > this.limit)
            throw 'Amazon limit reached';
    }

    static async buildVoices() {
        let voices = await AmazonTextToSpeechAPI.polly.describeVoices();

        return voices.Voices.map((voice) => {
            return {
                language: voice.LanguageName,
                code: voice.LanguageCode,
                translate: voice.LanguageCode.substr(0, 2),
                voice: voice.Id,
                gender: voice.Gender.toUpperCase(),
                provider: 'amazon',
                voice_alias: voice.Name,
            };
        });
    }
}

module.exports = AmazonTextToSpeechAPI;
