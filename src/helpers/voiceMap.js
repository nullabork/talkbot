/*jshint esversion: 9 */
var Common = require('@helpers/common'),
  query = require('array-query'),
  GoogleTextToSpeechAPI = require('@tts/GoogleTextToSpeechAPI');

function voiceMap(config) {

  this.voices = new GoogleTextToSpeechAPI().getVoices();

  this.getVoice = function (input) {
    var filter = function(value) {
      return input.trim().toLowerCase() == value.trim().toLowerCase();
    };

    var ret = query("voice")
      .filter(filter)
      .or("voice_alias")
      .filter(filter)
      .on(this.voices);

    if(!ret || !ret.length) return [];

    return ret;

  };

  this.getLang = function (input) {
    var filter = function(value) {
      return input.length > 1 && value.toLowerCase().indexOf(input.toLowerCase()) > -1;
    };

    var ret = query("code")
      .filter(filter)
      .on(this.voices);

    if(!ret || !ret.length) return [];
    return ret
  };

}

module.exports = new voiceMap();
