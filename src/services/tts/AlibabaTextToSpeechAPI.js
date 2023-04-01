/*jshint esversion: 9 */
// class for all the details of a command
const Common = require('@helpers/common'),
    auth = require('@auth'),
    fetch = require('node-fetch'),
    TextToSpeechService = require('@services/TextToSpeechService');

class AlibabaTextToSpeechAPI extends TextToSpeechService {
    // name of the service - eg. google, amazon, azure, watson
    get shortname() {
        return 'alibaba';
    }

    // is this API enabled
    get enabled() {
        return false; //auth.tts && auth.tts.alibaba && auth.tts.alibaba.enabled; // turn if off by not specifying it in the tts object
    }

    // get the char limit for this service
    get limit() {
        return auth.tts.alibaba.limit;
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
        const appkey = auth.tts.alibaba.appkey;
        const token = auth.tts.alibaba.token;
        const endpoint = auth.tts.alibaba.endpoint;

        if (!appkey || !token || !endpoint) {
            console.log(
                'Config variable tts.alibaba.appkey or tts.alibaba.token or tts.alibaba.endpoint is not set.',
            );
            process.exit(1);
        }

        try {
            AlibabaTextToSpeechAPI.appkey = appkey;
            AlibabaTextToSpeechAPI.token = token;
            AlibabaTextToSpeechAPI.endpoint = endpoint;
            AlibabaTextToSpeechAPI.voices = await AlibabaTextToSpeechAPI.buildVoices();
        } catch (err) {
            console.log(`Something went wrong: ${err}`);
            process.exit(1);
        }
        console.log('Loaded the Alibaba TTS API credentials OK.');
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
        var self = this;
        let options = {
            token: AlibabaTextToSpeechAPI.token,
            appkey: AlibabaTextToSpeechAPI.appkey,
            text: msg, // if textType is ssml, than here needs to be the ssml string
            voice: settings.name || self.getDefaultVoice('FEMALE', 'en-US'),
            format: 'mp3',
            sample_rate: '16000', // use default unless PCM
            speech_rate: 0,
            pitch_rate: 0,
            volume: 50,
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
            let response = await fetch(`${AlibabaTextToSpeechAPI.endpoint}`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(request),
            });

            let audioStream = await response.json();
            var ld = new lame.Decoder({
                sampleRate: 16000,
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
                fromRate: 16000,
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
        return AlibabaTextToSpeechAPI.voices;
    }

    getDefaultVoice(gender, lang_code) {
        var voices = AlibabaTextToSpeechAPI.voices.filter(
            (voice) => voice.code == lang_code && voice.gender == gender,
        );
        if (voices.length > 0) return voices[0].voice;
        var voices = AlibabaTextToSpeechAPI.voices.filter((voice) => voice.code == lang_code);
        if (voices.length > 0) return voices[0].voice;
        var voices = AlibabaTextToSpeechAPI.voices.filter(
            (voice) => voice.code == 'en-US' && voice.gender == gender,
        );
        if (voices.length > 0) return voices[0].voice;
        return 'xiaoyun';
    }

    getRandomVoice(randnum, gender, lang_code) {
        if (!randnum) randnum = Math.random() * 1000000;
        var voices = AlibabaTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code == lang_code) && (!gender || voice.gender == gender),
        );

        return voices[randnum % voices.length].voice;
    }

    doBookkeeping(request) {
        if (!AlibabaTextToSpeechAPI.count) AlibabaTextToSpeechAPI.count = 0;
        AlibabaTextToSpeechAPI.count += request.text.length;

        if (auth.tts.alibaba.enforce_limit && AlibabaTextToSpeechAPI.count > this.limit)
            throw 'Alibaba limit reached';
    }

    static async buildVoices() {
        return [
            {
                language: 'Chinese',
                code: 'cnm',
                translate: 'cn',
                voice: 'xiaoyun',
                gender: 'FEMALE',
                provider: 'alibaba',
                voice_alias: 'xiaoyun',
            },
        ];
        /*

Name	Value of the voice parameter	Type	Scenario	Supported language	Supported sampling rate (Hz)
Xiaoyun	Xiaoyun	Standard female voice	Common scenario	Chinese and mixed Chinese and English	8,000 and 16,000
Xiaogang	Xiaogang	Standard male voice	Common scenario	Chinese and mixed Chinese and English	8,000 and 16,000
Xiaomeng	Xiaomeng	Standard female voice	Common scenario	Chinese and mixed Chinese and English	8,000 and 16,000
Xiaowei	Xiaowei	Standard male voice	Common scenario	Chinese and mixed Chinese and English	8,000 and 16,000
Ruoxi	Ruoxi	Gentle female voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Siqi	Siqi	Gentle female voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Sijia	Sijia	Standard female voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Sicheng	Sicheng	Standard male voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aiqi	Aiqi	Gentle female voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aijia	Aijia	Standard female voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aicheng	Aicheng	Standard male voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aida	Aida	Standard male voice	Common scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Ninger	Ninger	Standard female voice	Common scenario	Chinese	8,000, 16,000, and 24,000
Ruilin	Ruilin	Standard female voice	Common scenario	Chinese	8,000, 16,000, and 24,000
Amei	Amei	Sweet female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000 and 16,000
Xiaoxue	Xiaoxue	Gentle female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000 and 16,000
Siyue	Siyue	Gentle female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aixia	Aixia	Amiable female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aimei	Aimei	Sweet female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aiyu	Aiyu	Natural female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aiyue	Aiyue	Gentle female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Aijing	Aijing	Strict female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Xiaomei	Xiaomei	Sweet female voice	Customer service scenario	Chinese and mixed Chinese and English	8,000, 16,000, and 24,000
Yina	Yina	Female voice with Zhejiang accent	Customer service scenario	Chinese	8,000, 16,000, and 24,000
Sijing	Sijing	Strict female voice	Customer service scenario	Chinese	8,000, 16,000, and 24,000
Sitong	Sitong	Child voice	Child voice scenario	Chinese	8,000, 16,000, and 24,000
Xiaobei	Xiaobei	Lolita female voice	Child voice scenario	Chinese	8,000, 16,000, and 24,000
Aibao	Aibao	Lolita female voice	Child voice scenario	Chinese	8,000, 16,000, and 24,000
Halen	Halen	Female voice	English scenario	English	8,000 and 16,000
Harry	Harry	Male voice	English scenario	English	8,000 and 16,000
Wendy	Wendy	Female voice	English scenario	English	8,000, 16,000, and 24,000
William	William	Male voice	English scenario	English	8,000, 16,000, and 24,000
Olivia	Olivia	Female voice	English scenario	English	8,000, 16,000, and 24,000
Shanshan	Shanshan	Cantonese female voice	Dialect scenario	Cantonese (simplified) and mixed Cantonese and English	8,000, 16,000, and 24,000
*/
    }
}

module.exports = AlibabaTextToSpeechAPI;
