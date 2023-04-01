/*jshint esversion: 9 */
// class for all the details of a command
const TextToSpeechService = require('@services/TextToSpeechService'),
    auth = require('@auth'),
    streamifier = require('streamifier'),
    MessageSSML = require('@models/MessageSSML'),
    tts = require('@google-cloud/text-to-speech');




class GoogleTextToSpeechAPI extends TextToSpeechService {
    static get client() {
        if (!GoogleTextToSpeechAPI.c) GoogleTextToSpeechAPI.c = new tts.TextToSpeechClient();
        return GoogleTextToSpeechAPI.c;
    }

    static get voices() {
        return (this._voices = this._voices || []);
    }

    static set voices(voicelist) {
        this._voices = voicelist;
    }
s
    // name of the service - eg. google, amazon, azure, watson
    get shortname() {
        return 'google';
    }

    // is this API enabled
    get enabled() {
        return auth.tts && auth.tts.google && auth.tts.google.enabled; // turn if off by not specifying it in the tts object
    }

    // get the char limit for this service
    get limit() {
        return auth.tts.google.limit;
    }

    get format() {
        return 'ogg/opus';
    }

    /**
     * [startupTests to check things this API needs to operate]
     *
     * Should exit the process if this is not configured correctly
     */
    async startupTests() {
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.log(
                'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. It should be set to a file path containing the Google API key.',
            );
            process.exit();
        }

        var auth = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

        // configured?
        if (
            !auth.type ||
            !auth.project_id ||
            !auth.private_key_id ||
            !auth.private_key ||
            !auth.client_email ||
            !auth.client_id ||
            !auth.auth_uri ||
            !auth.token_uri ||
            !auth.auth_provider_x509_cert_url ||
            !auth.client_x509_cert_url
        ) {
            console.log(
                'The Google API authentication file at ' +
                    process.env.GOOGLE_APPLICATION_CREDENTIALS +
                    ' appears to be malformed',
            );
            process.exit();
        }

        // test all the fields are correctly coming out of the voices
        try {
            GoogleTextToSpeechAPI.voices = await this.buildVoices();
        } catch (err) {
            console.log(err);
            process.exit();
        }

        console.log('Loaded the Google TTS API credentials OK.');
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
        var ssml = new MessageSSML(msg, { server: server }).build();
        var request = {
            input: { text: null, ssml: ssml },

            voice: {
                languageCode: settings.language || 'en-US', // all done by the voice code
                ssmlGender: settings.gender || 'NEUTRAL', // all done by the voice code
                name: settings.name || this.getDefaultVoice(settings.gender, settings.code),
            },
            // Select the type of audio encoding
            audioConfig: {
                audioEncoding: 'OGG_OPUS',
                //audioEncoding: 'MP3',
                pitch: settings.pitch || 0.0,
                speakingRate: settings.speed || 1.0,
                volume_gain_db: -6.0,
                //sample_rate_hertz: 12000,
                //effects_profile_id: ['telephony-class-application']
            },
        };

        return request;
    }

    /**
     * [getAudioContent from the underlying API]
     *
     * @param {*} request
     * @param {*} callback (err, audio) => {...}
     */
    getAudioContent(request, callback) {
        var client = GoogleTextToSpeechAPI.client; // singleton instance
        return client.synthesizeSpeech(request, (err, response) => {
            if (!response) return callback(err, null);

            var stm = new streamifier.createReadStream(response.audioContent);
            callback(err, stm);
        });
    }

    getDefaultVoice(gender, lang_code) {
        // guess a default based on lang and gender or just give htem the standard
        var voices = GoogleTextToSpeechAPI.voices.filter(
            (voice) => voice.code == lang_code && voice.gender == gender,
        );
        var standard = voices.filter((voice) => voice.type == 'Standard');
        // standard voices are cheaper
        if (standard.length > 0) return standard[0].voice;
        // give them anything if we dont have a standard one
        if (voices.length > 0) return voices[0].voice;
        // all else fails, they're `strayn
        return 'en-AU-Standard-D';
    }

    getRandomVoice(randnum, gender, lang_code) {
        if (!randnum) randnum = Math.random() * 1000000;
        var voices = GoogleTextToSpeechAPI.voices.filter(
            (voice) => (!lang_code || voice.code == lang_code) && (!gender || voice.gender == gender),
        );

        return voices[randnum % voices.length].voice;
    }

    async fetchAndMapVoices(mapFunction) {
        let map = [];

        const [result] = await GoogleTextToSpeechAPI.client.listVoices({});
        const voices = result.voices;

        voices.forEach((item) => {
            var voice = {
                type: /wavenet/gi.test(item.name) ? 'Wavenet' : 'Standard',
                code: item.languageCodes.length && item.languageCodes[0],
                codes: item.languageCodes,
                voice: item.name,
                translate: item.languageCodes.length && item.languageCodes[0].split('-')[0].substring(0, 2),
                language: item.name,
                gender: item.ssmlGender,
            };

            if (typeof mapFunction == 'function') {
                voice = mapFunction(voice);
            }

            map.push(voice);
        });

        return map;
    }

    getVoices() {
        return GoogleTextToSpeechAPI.voices;
    }

    async buildVoices() {
        var voices = [
            {
                language: 'Danish',
                type: 'Standard',
                code: 'da-DK',
                translate: 'da',
                voice: 'da-DK-Standard-A',
                voice_alias: 'Dora',
                gender: 'FEMALE',
            },
            {
                language: 'Danish',
                type: 'WaveNet',
                code: 'da-DK',
                translate: 'da',
                voice: 'da-DK-Wavenet-A',
                voice_alias: 'Heidi',
                gender: 'FEMALE',
            },

            {
                language: 'Dutch',
                type: 'Standard',
                code: 'nl-NL',
                translate: 'nl',
                voice: 'nl-NL-Standard-A',
                voice_alias: 'Eva',
                gender: 'FEMALE',
            },
            {
                language: 'Dutch',
                type: 'WaveNet',
                code: 'nl-NL',
                translate: 'nl',
                voice: 'nl-NL-Wavenet-A',
                voice_alias: 'Mila',
                gender: 'FEMALE',
            },

            {
                language: 'English (Australia)',
                type: 'Standard',
                code: 'en-AU',
                voice: 'en-AU-Standard-A',
                translate: 'en',
                voice_alias: 'Mia',
                gender: 'FEMALE',
            },
            {
                language: 'English (Australia)',
                type: 'Standard',
                code: 'en-AU',
                translate: 'en',
                voice: 'en-AU-Standard-B',
                voice_alias: 'Oliver',
                gender: 'MALE',
            },
            {
                language: 'English (Australia)',
                type: 'Standard',
                code: 'en-AU',
                translate: 'en',
                voice: 'en-AU-Standard-C',
                voice_alias: 'Chloe',
                gender: 'FEMALE',
            },
            {
                language: 'English (Australia)',
                type: 'Standard',
                code: 'en-AU',
                translate: 'en',
                voice: 'en-AU-Standard-D',
                voice_alias: 'Noah',
                gender: 'MALE',
            },
            {
                language: 'English (Australia)',
                type: 'WaveNet',
                code: 'en-AU',
                translate: 'en',
                voice: 'en-AU-Wavenet-A',
                voice_alias: 'Ava',
                gender: 'FEMALE',
            },
            {
                language: 'English (Australia)',
                type: 'WaveNet',
                code: 'en-AU',
                translate: 'en',
                voice: 'en-AU-Wavenet-B',
                voice_alias: 'Thomas',
                gender: 'MALE',
            },
            {
                language: 'English (Australia)',
                type: 'WaveNet',
                code: 'en-AU',
                translate: 'en',
                voice: 'en-AU-Wavenet-C',
                voice_alias: 'Isla',
                gender: 'FEMALE',
            },
            {
                language: 'English (Australia)',
                type: 'WaveNet',
                code: 'en-AU',
                translate: 'en',
                voice: 'en-AU-Wavenet-D',
                voice_alias: 'James',
                gender: 'MALE',
            },

            {
                language: 'English (UK)',
                type: 'Standard',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Standard-A',
                voice_alias: 'Lily',
                gender: 'FEMALE',
            },
            {
                language: 'English (UK)',
                type: 'Standard',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Standard-B',
                voice_alias: 'Harry',
                gender: 'MALE',
            },
            {
                language: 'English (UK)',
                type: 'Standard',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Standard-C',
                voice_alias: 'Emily',
                gender: 'FEMALE',
            },
            {
                language: 'English (UK)',
                type: 'Standard',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Standard-D',
                voice_alias: 'Leo',
                gender: 'MALE',
            },
            {
                language: 'English (UK)',
                type: 'WaveNet',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Wavenet-A',
                voice_alias: 'Alice',
                gender: 'FEMALE',
            },
            {
                language: 'English (UK)',
                type: 'WaveNet',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Wavenet-B',
                voice_alias: 'Jacob',
                gender: 'MALE',
            },
            {
                language: 'English (UK)',
                type: 'WaveNet',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Wavenet-C',
                voice_alias: 'Beatrix',
                gender: 'FEMALE',
            },
            {
                language: 'English (UK)',
                type: 'WaveNet',
                code: 'en-GB',
                translate: 'en',
                voice: 'en-GB-Wavenet-D',
                voice_alias: 'Oscar',
                gender: 'MALE',
            },
            {
                language: 'English (US)',
                type: 'Standard',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Standard-B',
                voice_alias: 'Liam',
                gender: 'MALE',
            },

            {
                language: 'English (US)',
                type: 'Standard',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Standard-C',
                voice_alias: 'Emma',
                gender: 'FEMALE',
            },
            {
                language: 'English (US)',
                type: 'Standard',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Standard-D',
                voice_alias: 'Mason',
                gender: 'MALE',
            },
            {
                language: 'English (US)',
                type: 'Standard',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Standard-E',
                voice_alias: 'Grace',
                gender: 'FEMALE',
            },
            {
                language: 'English (US)',
                type: 'WaveNet',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Wavenet-A',
                voice_alias: 'Ethan',
                gender: 'MALE',
            },
            {
                language: 'English (US)',
                type: 'WaveNet',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Wavenet-B',
                voice_alias: 'Ben',
                gender: 'MALE',
            },
            {
                language: 'English (US)',
                type: 'WaveNet',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Wavenet-C',
                voice_alias: 'Ella',
                gender: 'FEMALE',
            },
            {
                language: 'English (US)',
                type: 'WaveNet',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Wavenet-D',
                voice_alias: 'William',
                gender: 'MALE',
            },
            {
                language: 'English (US)',
                type: 'WaveNet',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Wavenet-E',
                voice_alias: 'Alexis',
                gender: 'FEMALE',
            },
            {
                language: 'English (US)',
                type: 'WaveNet',
                code: 'en-US',
                translate: 'en',
                voice: 'en-US-Wavenet-F',
                voice_alias: 'Sarah',
                gender: 'FEMALE',
            },
            /*
      {

        "language": "French (France)",
        "type": "Standard",
        "code": "fr-FR",
        "translate" : 'fr',
        "voice": "fr-FR-Standard-A",
        "voice_alias" : "madeline",
        "gender": "FEMALE"
      },*/
            {
                language: 'French (France)',
                type: 'Standard',
                code: 'fr-FR',
                translate: 'fr',
                voice: 'fr-FR-Standard-B',
                voice_alias: 'jean-luc-picard',
                gender: 'MALE',
            },
            {
                language: 'French (France)',
                type: 'Standard',
                code: 'fr-FR',
                translate: 'fr',
                voice: 'fr-FR-Standard-C',
                voice_alias: 'Adele',
                gender: 'FEMALE',
            },
            {
                language: 'French (France)',
                type: 'Standard',
                code: 'fr-FR',
                translate: 'fr',
                voice: 'fr-FR-Standard-D',
                voice_alias: 'Adam',
                gender: 'MALE',
            },
            {
                language: 'French (France)',
                type: 'WaveNet',
                code: 'fr-FR',
                translate: 'fr',
                voice: 'fr-FR-Wavenet-A',
                voice_alias: 'Jeanne',
                gender: 'FEMALE',
            },
            {
                language: 'French (France)',
                type: 'WaveNet',
                code: 'fr-FR',
                translate: 'fr',
                voice: 'fr-FR-Wavenet-B',
                voice_alias: 'Paul',
                gender: 'MALE',
            },
            {
                language: 'French (France)',
                type: 'WaveNet',
                code: 'fr-FR',
                translate: 'fr',
                voice: 'fr-FR-Wavenet-C',
                voice_alias: 'Ines',
                gender: 'FEMALE',
            },
            {
                language: 'French (France)',
                type: 'WaveNet',
                code: 'fr-FR',
                translate: 'fr',
                voice: 'fr-FR-Wavenet-D',
                voice_alias: 'Arthur',
                gender: 'MALE',
            },

            {
                language: 'French (Canada)',
                type: 'Standard',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Standard-A',
                voice_alias: 'Romy',
                gender: 'FEMALE',
            },
            {
                language: 'French (Canada)',
                type: 'Standard',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Standard-B',
                voice_alias: 'Logan',
                gender: 'MALE',
            },
            {
                language: 'French (Canada)',
                type: 'Standard',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Standard-C',
                voice_alias: 'Rosa',
                gender: 'FEMALE',
            },
            {
                language: 'French (Canada)',
                type: 'Standard',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Standard-D',
                voice_alias: 'Felix',
                gender: 'MALE',
            },
            {
                language: 'French (Canada)',
                type: 'WaveNet',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Wavenet-A',
                voice_alias: 'Delphine',
                gender: 'FEMALE',
            },
            {
                language: 'French (Canada)',
                type: 'WaveNet',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Wavenet-B',
                voice_alias: 'Alexandre',
                gender: 'MALE',
            },
            {
                language: 'French (Canada)',
                type: 'WaveNet',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Wavenet-C',
                voice_alias: 'Camille',
                gender: 'FEMALE',
            },
            {
                language: 'French (Canada)',
                type: 'WaveNet',
                code: 'fr-CA',
                translate: 'fr',
                voice: 'fr-CA-Wavenet-D',
                voice_alias: 'George',
                gender: 'MALE',
            },

            {
                language: 'German',
                type: 'Standard',
                code: 'de-DE',
                translate: 'de',
                voice: 'de-DE-Standard-A',
                voice_alias: 'Hanna',
                gender: 'FEMALE',
            },
            {
                language: 'German',
                type: 'Standard',
                code: 'de-DE',
                translate: 'de',
                voice: 'de-DE-Standard-B',
                voice_alias: 'Finn',
                gender: 'MALE',
            },
            {
                language: 'German',
                type: 'WaveNet',
                code: 'de-DE',
                translate: 'de',
                voice: 'de-DE-Wavenet-A',
                voice_alias: 'Anna',
                gender: 'FEMALE',
            },
            {
                language: 'German',
                type: 'WaveNet',
                code: 'de-DE',
                translate: 'de',
                voice: 'de-DE-Wavenet-B',
                voice_alias: 'Jan',
                gender: 'MALE',
            },
            {
                language: 'German',
                type: 'WaveNet',
                code: 'de-DE',
                translate: 'de',
                voice: 'de-DE-Wavenet-C',
                voice_alias: 'Julia',
                gender: 'FEMALE',
            },
            {
                language: 'German',
                type: 'WaveNet',
                code: 'de-DE',
                translate: 'de',
                voice: 'de-DE-Wavenet-D',
                voice_alias: 'Jonas',
                gender: 'MALE',
            },

            {
                language: 'Italian',
                type: 'Standard',
                code: 'it-IT',
                translate: 'it',
                voice: 'it-IT-Standard-A',
                voice_alias: 'Greta',
                gender: 'FEMALE',
            },
            {
                language: 'Italian',
                type: 'WaveNet',
                code: 'it-IT',
                translate: 'it',
                voice: 'it-IT-Wavenet-A',
                voice_alias: 'Giulia',
                gender: 'FEMALE',
            },

            {
                language: 'Japanese',
                type: 'Standard',
                code: 'ja-JP',
                translate: 'ja',
                voice: 'ja-JP-Standard-A',
                voice_alias: 'Yui',
                gender: 'FEMALE',
            },
            {
                language: 'Japanese',
                type: 'WaveNet',
                code: 'ja-JP',
                translate: 'ja',
                voice: 'ja-JP-Wavenet-A',
                voice_alias: 'Rio',
                gender: 'FEMALE',
            },

            {
                language: 'Korean',
                type: 'Standard',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Standard-A',
                voice_alias: 'Ji-woo',
                gender: 'FEMALE',
            },
            {
                language: 'Korean',
                type: 'Standard',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Standard-B',
                voice_alias: 'Seo-yeon',
                gender: 'FEMALE',
            },
            {
                language: 'Korean',
                type: 'Standard',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Standard-C',
                voice_alias: 'Ye-jun',
                gender: 'MALE',
            },
            {
                language: 'Korean',
                type: 'Standard',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Standard-D',
                voice_alias: 'Do-yoon',
                gender: 'MALE',
            },
            {
                language: 'Korean',
                type: 'WaveNet',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Wavenet-A',
                voice_alias: 'Seo-yun',
                gender: 'FEMALE',
            },
            {
                language: 'Korean',
                type: 'WaveNet',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Wavenet-B',
                voice_alias: 'Min-seo',
                gender: 'FEMALE',
            },
            {
                language: 'Korean',
                type: 'WaveNet',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Wavenet-C',
                voice_alias: 'Hyun-woo',
                gender: 'MALE',
            },
            {
                language: 'Korean',
                type: 'WaveNet',
                code: 'ko-KR',
                translate: 'ko',
                voice: 'ko-KR-Wavenet-D',
                voice_alias: 'Gun-woo',
                gender: 'MALE',
            },

            {
                language: 'Norwegian',
                type: 'Standard',
                code: 'nb-NO',
                translate: 'nb',
                voice: 'nb-NO-Standard-E',
                voice_alias: 'Hilda',
                gender: 'FEMALE',
            },
            {
                language: 'Norwegian',
                type: 'WaveNet',
                code: 'nb-NO',
                translate: 'nb',
                voice: 'nb-NO-Wavenet-E',
                voice_alias: 'Liv',
                gender: 'FEMALE',
            },

            {
                language: 'Polish',
                type: 'Standard',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Standard-A',
                voice_alias: 'Ada',
                gender: 'FEMALE',
            },
            {
                language: 'Polish',
                type: 'Standard',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Standard-B',
                voice_alias: 'Oskar',
                gender: 'MALE',
            },
            {
                language: 'Polish',
                type: 'Standard',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Standard-C',
                voice_alias: 'Robert',
                gender: 'MALE',
            },
            {
                language: 'Polish',
                type: 'Standard',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Standard-D',
                voice_alias: 'Nadia',
                gender: 'FEMALE',
            },
            {
                language: 'Polish',
                type: 'Standard',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Standard-E',
                voice_alias: 'Danka',
                gender: 'FEMALE',
            },

            {
                language: 'Polish',
                type: 'WaveNet',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Wavenet-A',
                voice_alias: 'Ela',
                gender: 'FEMALE',
            },
            {
                language: 'Polish',
                type: 'WaveNet',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Wavenet-B',
                voice_alias: 'Stefan',
                gender: 'MALE',
            },
            {
                language: 'Polish',
                type: 'WaveNet',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Wavenet-C',
                voice_alias: 'Olaf',
                gender: 'MALE',
            },
            {
                language: 'Polish',
                type: 'WaveNet',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Wavenet-D',
                voice_alias: 'Marta',
                gender: 'FEMALE',
            },
            {
                language: 'Polish',
                type: 'WaveNet',
                code: 'pl-PL',
                translate: 'pl',
                voice: 'pl-PL-Wavenet-E',
                voice_alias: 'Wanda',
                gender: 'FEMALE',
            },

            {
                language: 'Portugese (Brazil)',
                type: 'Standard',
                code: 'pt-BR',
                translate: 'pt',
                voice: 'pt-BR-Standard-A',
                voice_alias: 'Maria',
                gender: 'FEMALE',
            },
            {
                language: 'Portugese (Brazil)',
                type: 'WaveNet',
                code: 'pt-BR',
                translate: 'pt',
                voice: 'pt-BR-Wavenet-A',
                voice_alias: 'Helena',
                gender: 'FEMALE',
            },

            {
                language: 'Portugese (Portugal)',
                type: 'Standard',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Standard-A',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Portugese (Portugal)',
                type: 'Standard',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Standard-B',
                voice_alias: '',
                gender: 'MALE',
            },
            {
                language: 'Portugese (Portugal)',
                type: 'Standard',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Standard-C',
                voice_alias: '',
                gender: 'MALE',
            },
            {
                language: 'Portugese (Portugal)',
                type: 'Standard',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Standard-D',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Portugese (Portugal)',
                type: 'WaveNet',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Wavenet-A',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Portugese (Portugal)',
                type: 'WaveNet',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Wavenet-B',
                voice_alias: '',
                gender: 'MALE',
            },
            {
                language: 'Portugese (Portugal)',
                type: 'WaveNet',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Wavenet-C',
                voice_alias: '',
                gender: 'MALE',
            },
            {
                language: 'Portugese (Portugal)',
                type: 'WaveNet',
                code: 'pt-PT',
                translate: 'pt',
                voice: 'pt-PT-Wavenet-D',
                voice_alias: '',
                gender: 'FEMALE',
            },

            {
                language: 'Russian',
                type: 'Standard',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Standard-A',
                voice_alias: 'Diana',
                gender: 'FEMALE',
            },
            {
                language: 'Russian',
                type: 'Standard',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Standard-B',
                voice_alias: 'Nikola',
                gender: 'MALE',
            },
            {
                language: 'Russian',
                type: 'Standard',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Standard-C',
                voice_alias: 'Nina',
                gender: 'FEMALE',
            },
            {
                language: 'Russian',
                type: 'Standard',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Standard-D',
                voice_alias: 'Luca',
                gender: 'MALE',
            },

            {
                language: 'Russian',
                type: 'WaveNet',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Wavenet-A',
                voice_alias: 'Tanya',
                gender: 'FEMALE',
            },
            {
                language: 'Russian',
                type: 'WaveNet',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Wavenet-B',
                voice_alias: 'Boris',
                gender: 'MALE',
            },
            {
                language: 'Russian',
                type: 'WaveNet',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Wavenet-C',
                voice_alias: 'Veronica',
                gender: 'FEMALE',
            },
            {
                language: 'Russian',
                type: 'WaveNet',
                code: 'ru-RU',
                translate: 'ru',
                voice: 'ru-RU-Wavenet-D',
                voice_alias: 'Ivan',
                gender: 'MALE',
            },

            {
                language: 'Slovak',
                type: 'Standard',
                code: 'sk-SK',
                translate: 'sk',
                voice: 'sk-SK-Standard-A',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Slovak',
                type: 'WaveNet',
                code: 'sk-SK',
                translate: 'sk',
                voice: 'sk-SK-Wavenet-A',
                voice_alias: '',
                gender: 'FEMALE',
            },

            {
                language: 'Spanish',
                type: 'Standard',
                code: 'es-ES',
                translate: 'es',
                voice: 'es-ES-Standard-A',
                voice_alias: 'Camila',
                gender: 'FEMALE',
            },

            {
                language: 'Swedish',
                type: 'Standard',
                code: 'sv-SE',
                translate: 'sv',
                voice: 'sv-SE-Standard-A',
                voice_alias: 'Ebba',
                gender: 'FEMALE',
            },
            {
                language: 'Swedish',
                type: 'WaveNet',
                code: 'sv-SE',
                translate: 'sv',
                voice: 'sv-SE-Wavenet-A',
                voice_alias: 'Agnes',
                gender: 'FEMALE',
            },

            {
                language: 'Turkish',
                type: 'Standard',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Standard-A',
                voice_alias: 'Azra',
                gender: 'FEMALE',
            },
            {
                language: 'Turkish',
                type: 'Standard',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Standard-B',
                voice_alias: '',
                gender: 'MALE',
            },
            {
                language: 'Turkish',
                type: 'Standard',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Standard-C',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Turkish',
                type: 'Standard',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Standard-D',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Turkish',
                type: 'Standard',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Standard-E',
                voice_alias: '',
                gender: 'MALE',
            },

            {
                language: 'Turkish',
                type: 'WaveNet',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Wavenet-A',
                voice_alias: 'Ecrin',
                gender: 'FEMALE',
            },
            {
                language: 'Turkish',
                type: 'WaveNet',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Wavenet-B',
                voice_alias: '',
                gender: 'MALE',
            },
            {
                language: 'Turkish',
                type: 'WaveNet',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Wavenet-C',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Turkish',
                type: 'WaveNet',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Wavenet-D',
                voice_alias: '',
                gender: 'FEMALE',
            },
            {
                language: 'Turkish',
                type: 'WaveNet',
                code: 'tr-TR',
                translate: 'tr',
                voice: 'tr-TR-Wavenet-E',
                voice_alias: '',
                gender: 'MALE',
            },
            {
                language: 'Ukranian',
                type: 'Standard',
                code: 'uk-UA',
                translate: 'uk',
                voice: 'uk-UA-Standard-A',
                voice_alias: 'Katya',
                gender: 'FEMALE',
            },
            {
                language: 'Ukranian',
                type: 'WaveNet',
                code: 'uk-UA',
                translate: 'uk',
                voice: 'uk-UA-Wavenet-A',
                voice_alias: 'Elina',
            },
        ];

        var voiceMap = new Map();
        voices.forEach((voice) => {
            voiceMap.set(voice.voice, voice);
        });

        let fetchMap = await this.fetchAndMapVoices((voice) => {
            if (voiceMap.has(voice.voice)) {
                voice = {
                    ...voice,
                    ...voiceMap.get(voice.voice),
                };
            }

            voice.provider = this.shortname;
            voice.voice_alias = voice.voice_alias || voice.voice;
            return voice;
        });

        return fetchMap;
    }
}

module.exports = GoogleTextToSpeechAPI;
