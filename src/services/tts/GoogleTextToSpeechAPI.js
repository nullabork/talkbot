/*jshint esversion: 9 */
// class for all the details of a command
var Common = require('@helpers/common'),
  TextToSpeechService = require('@services/TextToSpeechService'),
  tts = require('@google-cloud/text-to-speech');

class GoogleTextToSpeechAPI extends TextToSpeechService {

  static get client() {
    return this.c = this.c || new tts.TextToSpeechClient();
  }

  // name of the service - eg. google, amazon, azure, watson
  get shortname() {
    return "unset";
  }

  // is this API enabled
  get enabled() {
    return true;
  }

  // get the char limit for this service
  get limit() {
    return 4 * 1000 * 1000;
  }

  /**
   * [startupTests to check things this API needs to operate]
   *
   * Should exit the process if this is not configured correctly
   */
  startupTests() {
    if(!process.env.GOOGLE_APPLICATION_CREDENTIALS) { 
      console.log('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. It should be set to a file path containing the Google API key.'); 
      process.exit();
    }
    
    var auth = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    if ( !auth.type || !auth.project_id || !auth.private_key_id || !auth.private_key || !auth.client_email || !auth.client_id || !auth.auth_uri || !auth.token_uri || !auth.auth_provider_x509_cert_url || !auth.client_x509_cert_url )
    {
      console.log("The Google API authentication file at " + process.env.GOOGLE_APPLICATION_CREDENTIALS + " appears to be malformed");
      process.exit();
    }    
    
    console.log("Loaded the Google TTS API credentials OK.");    
  }

  /**
   * [buildRequest to the underlying API]
   *
   * @param {*} ssml
   * @param {*} settings
   *
   * @return  {[type]}  [return request object for this API]
   */
  buildRequest (ssml, settings) {
    var request = {
      input: { text: null, ssml: ssml },
      // Select the language and SSML Voice Gender (optional)
      voice: {
        languageCode: settings.language || '',
        ssmlGender: settings.gender || 'NEUTRAL',
        name: settings.name || ''
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
   * @param {*} callback (response, err) => {...}
   */
  getAudioContent (request, callback) {
    var client = GoogleTextToSpeechAPI.client; // singleton instance
    return client.synthesizeSpeech(request, callback);
  }
}

module.exports = GoogleTextToSpeechAPI;