/*jshint esversion: 9 */
// class for all the details of a command
const Common = require('@helpers/common'),
  TextToSpeechService = require('@services/TextToSpeechService'),
  auth = require("@auth"),
  lame = require('lame'),
  samplerate = require('node-libsamplerate'),
  prism = require('prism-media'),
  MessageSSML = require('@models/MessageSSML'),
  fs = require('fs'),
  xmlentities = require('xml-entities'),
  ssmlvalid = require('ssml-validator'),
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

  // i know this is PCM and we're using ogg_vorbis with play stream, but it doesn't work if I switch to ogg 
  // google works fine!
  get format() { return "opus"; }

  get rate() { return 22050; }

  /**
   * [startupTests to check things this API needs to operate]
   *
   * Should exit the process if this is not configured correctly
   */
  startupTests() {

    const accessKeyId = auth.tts.amazon.accessKeyId;
    const secretAccessKey = auth.tts.amazon.secretAccessKey;
    
    if (!secretAccessKey || !accessKeyId) {
      console.log('Config variable tts.amazon.accessKeyId or tts.amazon.secretAccessKey is not set.');
      process.exit(1);
    }

    try {
      AmazonTextToSpeechAPI.polly = new amazon({accessKeyId: accessKeyId, secretAccessKey: secretAccessKey});    
      AmazonTextToSpeechAPI.voices = AmazonTextToSpeechAPI.buildVoices();
      //var v = await self.getVoicesFromAzure(self.accessToken);
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
  buildRequest (msg, settings, server) {

    if ( !settings['amazon-xml-encode-disabled'])
      msg = ssmlvalid.correct(msg);
    if ( !settings['amazon-breaths-disabled'] )
      msg  = '<amazon:auto-breaths>' + msg + '</amazon:auto-breaths>';
    
    var ssml = new MessageSSML(msg, { server: server }).build();
    var self = this;
    let options = {
      text: ssml, // if textType is ssml, than here needs to be the ssml string
      textType: "ssml", // marks if it is ssml, text etc. - optional
      voiceId: settings.name || self.getDefaultVoice(settings.gender, settings.language), // Polly Voice -> also determines the language - optional settings.voice ||
      outputFormat: "mp3", // all polly output formats like mp3, pcm etc. - optional
      sampleRate: self.rate // use default unless PCM
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

    var self = this;

    self.doBookkeeping(request);
    AmazonTextToSpeechAPI.polly.textToSpeech(request, (err, audioStream) => {
      if (err) {
        Common.error(err);
        callback(new Error(err), null);
        return;
      }
      try {

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
          toDepth: 16
        });

        callback(null, audioStream.pipe(ld).pipe(resample).pipe(new prism.opus.Encoder({rate: 48000, channels: 1, frameSize: 960 })));
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

  getDefaultVoice(gender, lang_code) {
    var voices = AmazonTextToSpeechAPI.voices.filter(voice => voice.code == lang_code && voice.gender == gender);
    if ( voices.length > 0 ) return voices[0].voice;
    return 'Kimberly';
  }

  doBookkeeping(request) {
    if ( !AmazonTextToSpeechAPI.count ) AmazonTextToSpeechAPI.count = 0;
    AmazonTextToSpeechAPI.count += request.text.length;

    if ( auth.tts.amazon.enforce_limit && AmazonTextToSpeechAPI.count > this.limit )
      throw 'Amazon limit reached';
  }

  static buildVoices() {
    var v = [
      {"language":"Arabic","code":"ar-AR","translate":"ar","voice":"Zeina","gender":"FEMALE"},      
      
      {"language":"Chinese (Mandarin)","code":"zh-CN","translate":"zh","voice":"Zhiyu","gender":"FEMALE"},     

      {"language":"Danish","code":"da-DK","translate":"da","voice":"Naja","gender":"FEMALE"},      
      {"language":"Danish","code":"da-DK","translate":"da","voice":"Mads","gender":"MALE"},      
      
      {"language":"Dutch","code":"nl-NL","translate":"nl","voice":"Lotte","gender":"FEMALE"},      
      {"language":"Dutch","code":"nl-NL","translate":"nl","voice":"Ruben","gender":"MALE"},      

      {"language":"English (Australian)","code":"en-AU","translate":"en","voice":"Nicole","gender":"FEMALE"},      
      {"language":"English (Australian)","code":"en-AU","translate":"en","voice":"Russell","gender":"MALE"},  

      {"language":"English (British)","code":"en-GB","translate":"en","voice":"Amy","gender":"FEMALE"},      
      {"language":"English (British)","code":"en-GB","translate":"en","voice":"Emma","gender":"FEMALE"},      
      {"language":"English (British)","code":"en-GB","translate":"en","voice":"Brian","gender":"MALE"},     

      {"language":"English (Indian)","code":"en-IN","translate":"en","voice":"Aditi","gender":"FEMALE"},      
      {"language":"English (Indian)","code":"en-IN","translate":"en","voice":"Raveena","gender":"FEMALE"},  

      {"language":"English (US)","code":"en-US","translate":"en","voice":"Joanna","gender":"FEMALE"},      
      {"language":"English (US)","code":"en-US","translate":"en","voice":"Kendra","gender":"FEMALE"},      
      {"language":"English (US)","code":"en-US","translate":"en","voice":"Kimberly","gender":"FEMALE"},      
      {"language":"English (US)","code":"en-US","translate":"en","voice":"Ivy","gender":"FEMALE"},      
      {"language":"English (US)","code":"en-US","translate":"en","voice":"Salli","gender":"FEMALE"},      
      {"language":"English (US)","code":"en-US","translate":"en","voice":"Joey","gender":"MALE"},      
      {"language":"English (US)","code":"en-US","translate":"en","voice":"Justin","gender":"MALE"},      
      {"language":"English (US)","code":"en-US","translate":"en","voice":"Matthew","gender":"MALE"},      

      {"language":"English (Welsh)","code":"en-GB-WLS","translate":"en","voice":"Geraint","gender":"MALE"},      

      {"language":"French (France)","code":"fr-FR","translate":"fr","voice":"Celine","gender":"FEMALE"},      
      {"language":"French (France)","code":"fr-FR","translate":"fr","voice":"Léa","gender":"FEMALE"},      
      {"language":"French (France)","code":"fr-FR","translate":"fr","voice":"Mathieu","gender":"MALE"},      

      {"language":"French (Canada)","code":"fr-CA","translate":"fr","voice":"Chantal","gender":"FEMALE"},      

      {"language":"German","code":"de-DE","translate":"de","voice":"Marlene","gender":"FEMALE"},      
      {"language":"German","code":"de-DE","translate":"de","voice":"Vicki","gender":"FEMALE"},      
      {"language":"German","code":"de-DE","translate":"de","voice":"Hans","gender":"MALE"},  

      {"language":"Icelandic","code":"is-IS","translate":"is","voice":"Dora","gender":"FEMALE"},      
      {"language":"Icelandic","code":"is-IS","translate":"is","voice":"Karl","gender":"MALE"},     

      {"language":"Italian","code":"it-IT","translate":"it","voice":"Carla","gender":"FEMALE"},      
      {"language":"Italian","code":"it-IT","translate":"it","voice":"Bianca","gender":"FEMALE"},      
      {"language":"Italian","code":"it-IT","translate":"it","voice":"Giorgio","gender":"MALE"},    

      {"language":"Japanese","code":"ja-JP","translate":"ja","voice":"Mizuki","gender":"FEMALE"},      
      {"language":"Japanese","code":"ja-JP","translate":"ja","voice":"Takumi","gender":"MALE"},      

      {"language":"Korean","code":"ko-KR","translate":"ko","voice":"Seoyeon","gender":"FEMALE"},      

      {"language":"Norwegian","code":"nb-NO","translate":"nb","voice":"Liv","gender":"FEMALE"},      

      {"language":"Polish","code":"pl-PL","translate":"pl","voice":"Ewa","gender":"FEMALE"},      
      {"language":"Polish","code":"pl-PL","translate":"pl","voice":"Maja","gender":"FEMALE"},      
      {"language":"Polish","code":"pl-PL","translate":"pl","voice":"Jacek","gender":"MALE"},      
      {"language":"Polish","code":"pl-PL","translate":"pl","voice":"Jan","gender":"MALE"},      

      {"language":"Portuguese (Brazil)","code":"pt-BR","translate":"pt","voice":"Vitoria","gender":"FEMALE"},      
      {"language":"Portuguese (Brazil)","code":"pt-BR","translate":"pt","voice":"Ricardo","gender":"MALE"},      

      {"language":"Portuguese (Portugal)","code":"pt-PT","translate":"pt","voice":"Ines","gender":"FEMALE"},      
      {"language":"Portuguese (Portugal)","code":"pt-PT","translate":"pt","voice":"Cristiano","gender":"MALE"},      

      {"language":"Romanian","code":"ro-RO","translate":"ro","voice":"Carmen","gender":"FEMALE"},      

      {"language":"Russian","code":"ru-RU","translate":"ru","voice":"Tatyana","gender":"FEMALE"},      
      {"language":"Russian","code":"ru-RU","translate":"ru","voice":"Maxim","gender":"MALE"},      

      {"language":"Spanish (Spain)","code":"es-ES","translate":"es","voice":"Conchita","gender":"FEMALE"},      
      {"language":"Spanish (Spain)","code":"es-ES","translate":"es","voice":"Enrique","gender":"MALE"},      
      {"language":"Spanish (Spain)","code":"es-ES","translate":"es","voice":"Lucia","gender":"FEMALE"},      

      {"language":"Spanish (Mexico)","code":"es-MX","translate":"es","voice":"Mia","gender":"FEMALE"},    

      {"language":"Spanish (US)","code":"es-US","translate":"es","voice":"Penelope","gender":"FEMALE"},     
      {"language":"Spanish (US)","code":"es-US","translate":"es","voice":"Miguel","gender":"MALE"},      

      {"language":"Swedish","code":"sv-SE","translate":"sv","voice":"Astrid","gender":"FEMALE"},  

      {"language":"Turkish","code":"tr-TR","translate":"tr","voice":"Filiz","gender":"FEMALE"},    

      {"language":"Welsh","code":"cy-GB","translate":"cy","voice":"Gwyneth","gender":"FEMALE"}      
    ];

    // set the provider
    v.forEach(voice => voice.provider = "amazon");

    // alias is equal to the voice name
    v.forEach(voice => voice.voice_alias = voice.voice);

    return v;
  }

}

module.exports = AmazonTextToSpeechAPI;