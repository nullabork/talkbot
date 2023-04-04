/*jshint esversion: 9 */
const Common = require('@helpers/common'),
    TextToSpeechService = require('@services/TextToSpeechService'),
    auth = require('@auth'),
    rp = require('request-promise'),
    xmlbuilder = require('xmlbuilder');

class AzureTextToSpeechAPI extends TextToSpeechService {
    // name of the service - eg. google, amazon, azure, watson
    get shortname() {
        return 'azure';
    }

    // is this API enabled
    get enabled() {
        return auth.tts && auth.tts.azure && auth.tts.azure.enabled; // turn if off by not specifying it in the tts object
    }

    // url to access tts on azure
    get baseUrl() {
        return auth.tts.azure.endpoint || 'https://eastus.tts.speech.microsoft.com/';
    }

    // get the char limit for this service
    get limit() {
        return auth.tts.azure.limit;
    }

    get format() {
        return 'ogg/opus';
    }

    get accessToken() {
        return this.token;
    }
    set accessToken(value) {
        this.token = value;
    }

    /**
     * [startupTests to check things this API needs to operate]
     *
     * Should exit the process if this is not configured correctly
     */
    async startupTests() {
        const self = this;
        const subscriptionKey = auth.tts.azure.subscriptionKey;

        if (!subscriptionKey) {
            console.log('Config variable azure.subscriptionKey for your subscription key is not set.');
            process.exit(1);
        }

        try {
            self.accessToken = await self.getAccessToken(subscriptionKey);

            // accessToken expires after an hour so we need to renew it
            setInterval(
                () =>
                    self.getAccessToken(auth.tts.azure.subscriptionKey).then((token) => {
                        self.accessToken = token;
                    }),
                10 * 60 * 1000,
            );
            var v = await self.getVoicesFromAzure(self.accessToken);
            AzureTextToSpeechAPI.voices = self.processVoices(v);
        } catch (err) {
            console.log(`Something went wrong: ${err}`);
            process.exit(1);
        }
        console.log('Loaded the Azure TTS API credentials OK.');
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
        // Create the SSML request.
        let xml_body = xmlbuilder
            .create('speak')
            .att('version', '1.0')
            .att('xmlns', 'https://www.w3.org/2001/10/synthesis')
            .att('xml:lang', settings.language ? settings.language.toLowerCase() : 'en-US')
            .ele('voice')
            .att('name', settings.name)
            .txt(msg)
            .end();

        // Convert the XML into a string to send in the TTS request.
        let request = xml_body.toString();
        return request;
    }

    /**
     * [getAudioContent from the underlying API]
     *
     * @param {*} request
     * @param {*} callback (err, audio) => {...}
     */
    getAudioContent(request, callback) {
        var self = this;
        let options = {
            method: 'POST',
            baseUrl: self.baseUrl,
            url: 'cognitiveservices/v1',
            headers: {
                Authorization: 'Bearer ' + self.accessToken,
                'cache-control': 'no-cache',
                'User-Agent': 'AzureTextToSpeechAPI',
                'X-Microsoft-OutputFormat': 'ogg-24khz-16bit-mono-opus',
                'Content-Type': 'application/ssml+xml',
            },
            body: request,
        };

        let p = rp(options)
            .on('response', (response) => {
                if (response.statusCode === 200) {
                    callback(null, async () => response);
                } else {
                    Common.error(response);
                    callback(new Error('HTTP ERROR: ' + response.statusCode));
                }
            })
            .on('error', (err) => callback(err));
        return p;
    }

    getVoices() {
        return AzureTextToSpeechAPI.voices;
    }

    getDefaultVoice(gender, lang_code) {
        if (!AzureTextToSpeechAPI.voices || !AzureTextToSpeechAPI.voices.length) return 'en-GB-Susan';
        var voices = AzureTextToSpeechAPI.voices.filter((v) => v.code == lang_code && v.gender == gender);
        if (voices.length) return voices[0].voice;
        return 'en-GB-Susan';
    }

    getRandomVoice(randnum, gender, lang_code) {
        if (!randnum) randnum = Math.random() * 1000000;
        var voices = AzureTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code == lang_code) && (!gender || voice.gender == gender),
        );

        return voices[randnum % voices.length].voice;
    }

    getVoicesFromAzure(accessToken) {
        let options = {
            method: 'GET',
            url: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/voices/list',
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
            },
            transform: (body) => JSON.parse(body),
            transform2xxOnly: true,
        };

        let p = rp(options)
            .then((response) => {
                return response;
            })
            .catch((err) => Common.error(err));
        return p;
    }

    processVoices(voices) {
        var v = [];

        for (var index in voices) {
            var voice = voices[index];

            var map = this.voiceMap ? this.voiceMap[voice.ShortName] : null;

            var n = {
                provider: this.shortname,
                voice: voice.ShortName,
                code: voice.Locale,
                translate: map ? map.translate : voice.Locale.substring(0, 2),
                gender: map ? map.gender : this.standardiseGender(voice.Gender),
                voice_alias: map ? map.alias : voice.ShortName,
                language: map ? map.language : voice.Locale,
            };

            v.push(n);
        }

        return v;
    }

    standardiseGender(token) {
        if (!token) return '';
        if (token.substring(0, 1) == 'F') return 'FEMALE';
        if (token.substring(0, 1) == 'M') return 'MALE';
        return '';
    }

    // gets a temporary token that lasts a short while to access the service
    async getAccessToken(subscriptionKey) {
        let options = {
            method: 'POST',
            uri: 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken',
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
            },
        };
        return rp(options);
    }
}

module.exports = AzureTextToSpeechAPI;
