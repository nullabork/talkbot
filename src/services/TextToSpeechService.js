/*jshint esversion: 9 */
// class for all the details of a command
var Common = require('@helpers/common');

class TextToSpeechService {

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
  startupTests () {
    Common.out('Please implement the startupTests function');
  }

  /**
   * [buildRequest to the underlying API]
   *
   * @param {*} message
   * @param {*} settings
   *
   * @return  {[type]}  [return request object for this API]
   */
  buildRequest (message, settings) {
    Common.out('Please implement the buildRequest function');
  }

  /**
   * [getAudioContent from the underlying API]
   *
   * @param {*} request
   * @param {*} callback
   *
   * @return  {[type]}  [return audioContent]
   */
  getAudioContent (request, callback) {
    Common.out('Please implement the getAudioContent function');
  }

  static getService(settings) {

    var tts = require('@tts/GoogleTextToSpeechAPI');
    // fill me out with proper finding of the class thingos
    return new tts();
  }
}

module.exports = TextToSpeechService;
