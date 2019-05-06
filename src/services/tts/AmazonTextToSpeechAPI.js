/*jshint esversion: 9 */
// class for all the details of a command
const Common = require('@helpers/common'),
  TextToSpeechService = require('@services/TextToSpeechService'),
  auth = require("@auth"),
  amazon = require('polly-tts');  

class AmazonTextToSpeechAPI extends TextToSpeechService {

  // name of the service - eg. google, amazon, azure, watson
  get shortname() {
    return "amazon";
  }

  // is this API enabled
  get enabled() {
    return auth.tts && auth.tts.amazon && auth.tts.amazon.enabled; // turn if off by not specifying it in the tts object
  }

  // get the char limit for this service
  get limit() {
    return auth.tts.amazon.limit;
  }

  get format() { return "ogg"; }

  /**
   * [startupTests to check things this API needs to operate]
   *
   * Should exit the process if this is not configured correctly
   */
  startupTests() {

    const accessKeyId = auth.tts.amazon.accessKeyId;
    const secretAccessKey = auth.tts.amazon.secretAccessKey;
    
    if (!secretAccessKey || !accessKeyId) {
      console.log('Config variable amazon.accessKeyId or amazon.secretAccessKey is not set.');
      process.exit(1);
    }

    try {
      AmazonTextToSpeechAPI.polly = new amazon({accessKeyId: accessKeyId, secretAccessKey: secretAccessKey});    
      //var v = await self.getVoicesFromAzure(self.accessToken);
      //AmazonTextToSpeechAPI.voices = self.processVoices(v);
      //TextToSpeechService.checkVoiceStructure(AmazonTextToSpeechAPI.voices);
    } catch (err) {
      console.log(`Something went wrong: ${err}`);
      process.exit(1);
    }    
    console.log("Loaded the Amazon TTS API credentials OK.");    
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

    let options = {
      text: ssml, // if textType is ssml, than here needs to be the ssml string
      textType: "ssml", // marks if it is ssml, text etc. - optional
      voiceId: "Vicki", // Polly Voice -> also determines the language - optional settings.voice ||
      outputFormat: "ogg" // all polly output formats like mp3, pcm etc. - optional
    };

    return options;
  }

  /**
   * [getAudioContent from the underlying API]
   *
   * @param {*} request
   * @param {*} callback (err, audio) => {...}
   */
  getAudioContent (request, callback) {

    AmazonTextToSpeechAPI.doBookkeeping(request);

    AmazonTextToSpeechAPI.polly.textToSpeech(request, (err, audioStream) => {
      if (err) {
        Common.error(err);
        return;
      }
      try {
        callback(null, audioStream);
      }
      catch(ex)
      {
        Common.error(ex);
        callback(ex, null);
      }
    });
  }

  getVoices() {
    return AmazonTextToSpeechAPI.voices;
  }

  doBookkeeping(request) {
    if ( !AmazonTextToSpeechAPI.count ) AmazonTextToSpeechAPI.count = 0;
    AmazonTextToSpeechAPI.count += request.ssml.length;

    if ( auth.tts.amazon.enforce_limit && AmazonTextToSpeechAPI.count > this.limit )
      throw 'Amazon limit reached';
  }
}

module.exports = AmazonTextToSpeechAPI;