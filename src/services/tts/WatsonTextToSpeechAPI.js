/*jshint esversion: 9 */
// class for all the details of a command
const Common = require("@helpers/common"),
  auth = require("@auth"),
  TextToSpeechService = require("@services/TextToSpeechService"),
  { IamAuthenticator  } = require('ibm-watson/auth'),
  watson = require('ibm-watson/text-to-speech/v1');

class WatsonTextToSpeechAPI extends TextToSpeechService {
  // name of the service - eg. google, amazon, azure, watson
  get shortname() {
    return "watson";
  }

  // is this API enabled
  get enabled() {
    return auth.tts && auth.tts.watson && auth.tts.watson.enabled; // turn if off by not specifying it in the tts object
  }

  // get the char limit for this service
  get limit() {
    return auth.tts.watson.limit;
  }

  // i know this is PCM and we're using ogg_vorbis with play stream, but it doesn't work if I switch to ogg
  // google works fine!
  get format() {
    return "ogg/opus";
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
    const apiKey = auth.tts.watson.apikey;
    const serviceUrl = auth.tts.watson.serviceUrl;

    if (!apiKey) {
      console.log(
        "Config variable tts.watson.apikey not set."
      );
      process.exit(1);
    }

    try {
      WatsonTextToSpeechAPI.watson = new watson({
            authenticator: new IamAuthenticator({
              apikey: apiKey,
            }),
            serviceUrl: serviceUrl, // eg. "https://api.au-syd.text-to-speech.watson.cloud.ibm.com/instances/<guid>"
      });
      WatsonTextToSpeechAPI.voices = await WatsonTextToSpeechAPI.buildVoices();
    } catch (err) {
      console.log(`Something went wrong: ${err}`);
      process.exit(1);
    }
    console.log("Loaded the Watson TTS API credentials OK.");
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

    const synthesizeParams = {
        text: msg,
        accept: 'audio/ogg;codecs=opus',
        voice: settings.name || self.getDefaultVoice("FEMALE", "en-US"),
      };    

    return synthesizeParams;
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
      let audioStream = await WatsonTextToSpeechAPI.watson.synthesize(request);

      callback(null, audioStream.result);
    } catch (err) {
      Common.error(request);
      Common.error(err);
      callback(new Error(err), null);
      return;
    }
  }

  getVoices() {
    return WatsonTextToSpeechAPI.voices;
  }

  getDefaultVoice(gender, lang_code) {
    return "en-US_MichaelVoice";
  }

  getRandomVoice(randnum, gender, lang_code) {
    if (!randnum) randnum = Math.random() * 1000000;
    let voices = WatsonTextToSpeechAPI.voices;

    return voices[randnum % voices.length].voice;
  }

  doBookkeeping(request) {
    if (!WatsonTextToSpeechAPI.count) WatsonTextToSpeechAPI.count = 0;
    WatsonTextToSpeechAPI.count += request.text.length;

    if (
      auth.tts.watson.enforce_limit &&
      WatsonTextToSpeechAPI.count > this.limit
    )
      throw "Watson limit reached";
  }

  static async buildVoices() {
    let voices = await WatsonTextToSpeechAPI.watson.listVoices();

    return voices.result.voices.map((voice) => {
      return {
        language: voice.language,
        code: voice.language,
        translate: voice.language.substr(0, 2),
        voice: voice.name,
        gender: voice.gender.toUpperCase(),
        provider: "watson",
        voice_alias: voice.name,
        description: voice.description
      };
    });
  }
}

module.exports = WatsonTextToSpeechAPI;
