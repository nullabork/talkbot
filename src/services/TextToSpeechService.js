/*jshint esversion: 9 */
// class for all the details of a command
const Common = require('@helpers/common'),
  fs = require('fs'),
  iso639 = require('iso-639'),
  paths = require('@paths');

// base class for building specific TTS APIs over
class TextToSpeechService {

  // name of the service - eg. google, amazon, azure, watson
  get shortname() {
    Common.error('Please implement the shortname property');
    process.exit();
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

  get format() {
    return "ogg";
  }

  /**
   * [startupTests to check things this API needs to operate]
   *
   * Should exit the process if this is not configured correctly
   */
  startupTests () {
    Common.error('Please implement the startupTests function');
    process.exit();
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
    Common.error('Please implement the buildRequest function');
    process.exit();
  }

  /**
   * [getAudioContent from the underlying API]
   *
   * @param {*} request
   * @param {*} callback (err, audio)
   *
   * @return  {[type]}  [return audioContent]
   */
  getAudioContent (request, callback) {
    Common.error('Please implement the getAudioContent function');
    process.exit();
  }

  /**
   * [getVoices get the voice configurations available from this service]
   *
   * @return  {[type]}  [return audioContent]
   */
  getVoices() {
    Common.error('Please implement the getVoices function');
    process.exit();
  }

  /**
   * [getDefaultVoice gets the default voice name for this service]
   *
   * @param {string} gender - eg. FEMALE
   * @param {string} lang_code eg. en-AU
   *
   * @return {string} voice name
   */
  getDefaultVoice(gender, lang_code) {
    Common.error('Please implement the getDefaultVoice function');
    process.exit();
  }

  /**
   * [checkVoiceStructure confirm the voices array is formed correctly]
   *
   * @param  {*}  voices
   */
  static checkVoiceStructure(voices) {

    for ( var index in voices )
    {
      var voice = voices[index];
      if ( !voice.voice_alias ) throw new Error('No voice_alias property:' + voice.voice);
      if ( voice.gender != 'MALE' && voice.gender != 'FEMALE' ) throw new Error('Invalid gender property: ' + voice.gender);
      if ( !voice.provider ) throw new Error('No provider property');
      if ( !voice.language ) throw new Error('No language property');
      if ( !voice.translate ) throw new Error('No translate property');
      if ( !iso639.iso_639_1[voice.translate]) throw new Error('Invalid translate ISO-639-1 code: "' + voice.translate + '"');
      if ( !voice.voice ) throw new Error('No voice property');
      if ( !voice.code ) throw new Error('No code property');
      if ( !iso639.iso_639_1[voice.code.substring(0,2)]) throw new Error('Invalid code part ISO-639-1 code: "' + voice.code.substring(0,2) + '". Expected Form: [ISO-639-1 code]-[ISO-3166-1 country code]');
    }
  }

  /**
   * Checks the provider meets the contract
   * 
   * @param {[TextToSpeechService]} provider 
   */
  static checkProviderContract(provider) {
    if ( provider.format != 'pcm' && provider.format != 'ogg') throw new Error('Unknown provider format');
    if ( !provider.shortname ) throw new Error('Provider shortname needs to be set');

    var voices = provider.getVoices();
    if ( voices.filter(voice => voice.provider != provider.shortname).length > 0) throw new Error('A voice has an incorrect provider string');
    TextToSpeechService.checkVoiceStructure(voices);

    // run a bunch of tests of the methods to see if we can fail them
    provider.getDefaultVoice('FEMALE', 'en-US');
    provider.buildRequest('', {});
  }

  // get the first provider
  static get defaultProvider() {
    return TextToSpeechService.providers[Object.keys(TextToSpeechService.providers)[0]];
  }

  static async setupProviders() {
    TextToSpeechService.providers = {};
    await fs.readdirSync(paths.tts)
    .forEach(async file => {
      try {
        var api = require(paths.tts + '/' + file);
        var obj = new api();
        if ( obj.enabled ) {
          await obj.startupTests();
          TextToSpeechService.checkProviderContract(obj);
          TextToSpeechService.providers[obj.shortname] = obj;
        }
      }
      catch(err) {
        Common.error('Error loading: ' + file);
        Common.error(err);
        process.exit(1);
      }
    });
  }

  /**
   * [getService find the API based on the member's settings]
   *
   * @param {[memberSettings]} settings
   *
   * @return  {[TextToSpeechService]}  [return an API object to serve TTS requests]
   */
  static getService(provider) {

    if (!provider) return null;
    provider = provider.toLowerCase();

    var service = TextToSpeechService.providers[provider];
    return service;
  }

  /**
   * [Tests if the lang_code is valid]
   *
   * @param {*} lang_code - ISO language code
   * @param {*} provider  - optional provider name eg. google
   *
   * @returns {boolean}
   */
  static isValidLang(lang_code, provider) {
    return TextToSpeechService.getVoiceRecords(lang_code, provider).length > 0;
  }

  static getVoiceRecords(lang_code, provider)
  {
    if ( provider ) {
      service = TextToSpeechService.getService(provider);
      var voices = service.getVoices().filter(voice => voice.code.toLowerCase().indexOf(lang_code.toLowerCase()) > -1);
      return voices;
    }
    else {
      var v = [];
      for( var provider in TextToSpeechService.providers) {
        TextToSpeechService.providers[provider].getVoices()
        .filter(voice => voice.code.toLowerCase().indexOf(lang_code.toLowerCase()) > -1)
        .forEach(voice => v.push(voice));
      }
      return v;
    }
  }

  static getVoice(voice_name, provider)
  {
    var v = null;
    var service = null;
    voice_name = voice_name.toLowerCase();

    if ( provider )
      service = TextToSpeechService.getService(provider);

    if ( service )
    {
      var voices = service.getVoices();
      for ( var key in voices)
      {
        v = voices[key];
        if ( v.voice.toLowerCase() == voice_name || v.voice_alias.toLowerCase() == voice_name )
          return v;
      }
    }
    else {
      for( var service in TextToSpeechService.providers )
      {
        var voices = TextToSpeechService.providers[service].getVoices();
        for ( var key in voices)
        {
          v = voices[key];
          if ( v.voice.toLowerCase() == voice_name || v.voice_alias.toLowerCase() == voice_name)
            return v;
        }
      }
    }
    return null;
  }
}

module.exports = TextToSpeechService;
