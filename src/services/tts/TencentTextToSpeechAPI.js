/*jshint esversion: 9 */
// class for all the details of a command
const auth = require('@auth'),
    tencent = require('tencentcloud-sdk-nodejs'),
    TextToSpeechService = require('@services/TextToSpeechService');

const ttsClient = tencent.tts.v20190823.Client;
const models = tencent.tts.v20190823.Models;

class TencentTextToSpeechAPI extends TextToSpeechService {
    // name of the service - eg. google, amazon, azure, watson
    get shortname() {
        return 'tencent';
    }

    // is this API enabled
    get enabled() {
        return auth.tts && auth.tts.tencent && auth.tts.tencent.enabled; // turn if off by not specifying it in the tts object
    }

    // get the char limit for this service
    get limit() {
        return auth.tts.tencent.limit;
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
        const accessKeyId = auth.tts.tencent.accessKeyId;
        const secretAccessKey = auth.tts.tencent.secretAccessKey;

        if (!secretAccessKey || !accessKeyId) {
            console.log('Config variable tts.tencent.accessKeyId or tts.tencent.secretAccessKey is not set.');
            process.exit(1);
        }

        try {
            let cred = new Credential(accessKeyId, secretAccessKey);
            let httpProfile = new HttpProfile();
            httpProfile.reqMethod = 'POST';
            httpProfile.reqTimeout = 30;
            httpProfile.endpoint = 'tts.tencentcloudapi.com';

            let clientProfile = new ClientProfile();
            clientProfile.signMethod = 'HmacSHA256';
            clientProfile.httpProfile = httpProfile;
            let client = new ttsClient(cred, 'ap-guangzhou', clientProfile);

            TencentTextToSpeechAPI.tencent = client;
            TencentTextToSpeechAPI.voices = await TencentTextToSpeechAPI.buildVoices();
        } catch (err) {
            console.log(`Something went wrong: ${err}`);
            process.exit(1);
        }
        console.log('Loaded the Tencent TTS API credentials OK.');
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
        let req = new models.TextToVoiceRequest();
        req.Text = msg;
        req.SessionId = '';
        req.ModelType = 1;
        req.Volume = 5;
        req.Speed = 1;
        req.ProjectId = 0;
        req.VoiceType = settings.name || self.getDefaultVoice('FEMALE', 'en-US');
        req.PrimaryLanguage = 1;
        req.SampleRate = 16000;
        req.Codec = 'opus';

        return req;
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
        const cb = (err, audioStream) => {
            callback(err, async () => audioStream.Audio);
        };

        TencentTextToSpeechAPI.tencent.TextToVoice(request, cb);
    }

    getVoices() {
        return TencentTextToSpeechAPI.voices;
    }

    getDefaultVoice(gender, lang_code) {
        var voices = TencentTextToSpeechAPI.voices.filter(
            (voice) => voice.code == lang_code && voice.gender == gender,
        );
        if (voices.length > 0) return voices[0].voice;
        var voices = TencentTextToSpeechAPI.voices.filter((voice) => voice.code == lang_code);
        if (voices.length > 0) return voices[0].voice;
        var voices = TencentTextToSpeechAPI.voices.filter(
            (voice) => voice.code == 'en-US' && voice.gender == gender,
        );
        if (voices.length > 0) return voices[0].voice;
        return '0';
    }

    getRandomVoice(randnum, gender, lang_code) {
        if (!randnum) randnum = Math.random() * 1000000;
        var voices = TencentTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code == lang_code) && (!gender || voice.gender == gender),
        );

        return voices[randnum % voices.length].voice;
    }

    doBookkeeping(request) {
        if (!TencentTextToSpeechAPI.count) TencentTextToSpeechAPI.count = 0;
        TencentTextToSpeechAPI.count += request.text.length;

        if (auth.tts.tencent.enforce_limit && TencentTextToSpeechAPI.count > this.limit)
            throw 'Tencent limit reached';
    }

    static async buildVoices() {
        /*
    0-Yun Xiaoning, female voice with affinity (default)
    1-Yun Xiaoqi, male voice with affinity
    2-Yun Xiaowan, mature male voice
    4-Yun Xiaoye, warm female voice
    5-Yun Xiaoxin, emotional female voice
    6-cloud Xiaolong, emotional male voice
    7-Yun Xiaoman, customer service female voice
    1000- zhixia , emotional male
    voice
    1001-zhiyu , emotional female voice 1002-zhiling, general female voice
    1003
    -chimei, customer service female voice 1050-WeJack, English male voice
    1051-WeRose, English Female voice
    quality sound: The
    quality sound is more realistic, and the price is different from ordinary timbre. Please check the buying guide
    101000-Zhi Xia, emotional male voice (fine product)
    101001-Zhi Yu, emotional female voice (fine product)
    101002- Zhi Ling, universal female voice )
    101003-Zhimei, Customer Service Female Voice (Excellent)
    101004-Zhiyun, General Male Voice
    101005-Zhi Li, General Female Voice
    101006-Zhi Yan, Assistant Female Voice
    101007-Jina, Customer Service Female Voice
    101008-Zhi Qi, Customer Service Female Voice
    101009-Zhi Yun, Intellectual Female Voice
    101010-Zhihua, Universal Male Voice
    101050-WeJack, English Male Voice (Excellent)
    101051-WeRose, English Female Voice (Excellent)
    102000-Bei Lei, Customer Service Female Voice
    102001-Baguo, Customer Service Female Voice
    102002-Bei Zi, Cantonese female voice
    102003-Bei Xue, news female voice*/

        return [
            {
                language: 'Chinese',
                code: 'cnn',
                translate: 'cnn',
                voice: 0,
                gender: 'FEMALE',
                provider: 'tencent',
                voice_alias: 'Yun Xiaoning',
            },
        ];
    }
}

module.exports = TencentTextToSpeechAPI;
