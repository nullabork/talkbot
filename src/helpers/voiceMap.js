var Common = require('@helpers/common'),
  query = require('array-query');

function voiceMap(config) {
  //this.codeMap = {};
  var self = this;


  this.voices = [
    {
      "language": "Dutch (Netherlands)",
      "type": "Standard",
      "code": "nl-NL",
      "translate" : 'en',
      "voice": "nl-NL-Standard-A",
      "voice_alias" : "Eva",
      "gender": "FEMALE"
    },
    {
      "language": "Dutch (Netherlands)",
      "type": "WaveNet",
      "code": "nl-NL",
      "translate" : 'en',
      "voice": "nl-NL-Wavenet-A",
      "voice_alias" : "Mila",
      "gender": "FEMALE"
    },
    {
      "language": "English (Australia)",
      "type": "Standard",
      "code": "en-AU",
      "voice": "en-AU-Standard-A",
      "translate" : 'en',
      "voice_alias" : "Mia",
      "gender": "FEMALE"
    },
    {
      "language": "English (Australia)",
      "type": "Standard",
      "code": "en-AU",
      "translate" : 'en',
      "voice": "en-AU-Standard-B",
      "voice_alias" : "Oliver",
      "gender": "MALE"
    },
    {
      "language": "English (Australia)",
      "type": "Standard",
      "code": "en-AU",
      "translate" : 'en',
      "voice": "en-AU-Standard-C",
      "voice_alias" : "Chloe",
      "gender": "FEMALE"
    },
    {
      "language": "English (Australia)",
      "type": "Standard",
      "code": "en-AU",
      "translate" : 'en',
      "voice": "en-AU-Standard-D",
      "voice_alias" : "Noah",
      "gender": "MALE"
    },
    {
      "language": "English (Australia)",
      "type": "WaveNet",
      "code": "en-AU",
      "translate" : 'en',
      "voice": "en-AU-Wavenet-A",
      "voice_alias" : "Ava",
      "gender": "FEMALE"
    },
    {
      "language": "English (Australia)",
      "type": "WaveNet",
      "code": "en-AU",
      "translate" : 'en',
      "voice": "en-AU-Wavenet-B",
      "voice_alias" : "Thomas",
      "gender": "MALE"
    },
    {
      "language": "English (Australia)",
      "type": "WaveNet",
      "code": "en-AU",
      "translate" : 'en',
      "voice": "en-AU-Wavenet-C",
      "voice_alias" : "Isla",
      "gender": "FEMALE"
    },
    {
      "language": "English (Australia)",
      "type": "WaveNet",
      "code": "en-AU",
      "translate" : 'en',
      "voice": "en-AU-Wavenet-D",
      "voice_alias" : "James",
      "gender": "MALE"
    },
    {
      "language": "English (UK)",
      "type": "Standard",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Standard-A",
      "voice_alias" : "Lily",
      "gender": "FEMALE"
    },
    {
      "language": "English (UK)",
      "type": "Standard",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Standard-B",
      "voice_alias" : "Harry",
      "gender": "MALE"
    },
    {
      "language": "English (UK)",
      "type": "Standard",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Standard-C",
      "voice_alias" : "Emily",
      "gender": "FEMALE"
    },
    {
      "language": "English (UK)",
      "type": "Standard",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Standard-D",
      "voice_alias" : "Leo",
      "gender": "MALE"
    },
    {
      "language": "English (UK)",
      "type": "WaveNet",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Wavenet-A",
      "voice_alias" : "Alice",
      "gender": "FEMALE"
    },
    {
      "language": "English (UK)",
      "type": "WaveNet",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Wavenet-B",
      "voice_alias" : "Jacob",
      "gender": "MALE"
    },
    {
      "language": "English (UK)",
      "type": "WaveNet",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Wavenet-C",
      "voice_alias" : "Beatrix",
      "gender": "FEMALE"
    },
    {
      "language": "English (UK)",
      "type": "WaveNet",
      "code": "en-GB",
      "translate" : 'en',
      "voice": "en-GB-Wavenet-D",
      "voice_alias" : "Oscar",
      "gender": "MALE"
    },
    {
      "language": "English (US)",
      "type": "Standard",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Standard-B",
      "voice_alias" : "Liam",
      "gender": "MALE"
    },
    {
      "language": "English (US)",
      "type": "Standard",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Standard-C",
      "voice_alias" : "Emma",
      "gender": "FEMALE"
    },
    {
      "language": "English (US)",
      "type": "Standard",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Standard-D",
      "voice_alias" : "Mason",
      "gender": "MALE"
    },
    {
      "language": "English (US)",
      "type": "Standard",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Standard-E",
      "voice_alias" : "Grace",
      "gender": "FEMALE"
    },
    {
      "language": "English (US)",
      "type": "WaveNet",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Wavenet-A",
      "voice_alias" : "Ethan",
      "gender": "MALE"
    },
    {
      "language": "English (US)",
      "type": "WaveNet",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Wavenet-B",
      "voice_alias" : "Ben",
      "gender": "MALE"
    },
    {
      "language": "English (US)",
      "type": "WaveNet",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Wavenet-C",
      "voice_alias" : "Ella",
      "gender": "FEMALE"
    },
    {
      "language": "English (US)",
      "type": "WaveNet",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Wavenet-D",
      "voice_alias" : "William",
      "gender": "MALE"
    },
    {
      "language": "English (US)",
      "type": "WaveNet",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Wavenet-E",
      "voice_alias" : "Alexis",
      "gender": "FEMALE"
    },
    {
      "language": "English (US)",
      "type": "WaveNet",
      "code": "en-US",
      "translate" : 'en',
      "voice": "en-US-Wavenet-F",
      "voice_alias" : "Sarah",
      "gender": "FEMALE"
    },
    {
      "language": "French",
      "type": "Standard",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Standard-A",
      "voice_alias" : "madeline",
      "gender": "FEMALE"
    },
    {
      "language": "French",
      "type": "Standard",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Standard-B",
      "voice_alias" : "jean-luc-picard",
      "gender": "MALE"
    },
    {
      "language": "French",
      "type": "Standard",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Standard-C",
      "voice_alias" : "Adele",
      "gender": "FEMALE"
    },
    {
      "language": "French",
      "type": "Standard",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Standard-D",
      "voice_alias" : "Adam",
      "gender": "MALE"
    },
    {
      "language": "French",
      "type": "WaveNet",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Wavenet-A",
      "voice_alias" : "Jeanne",
      "gender": "FEMALE"
    },
    {
      "language": "French",
      "type": "WaveNet",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Wavenet-B",
      "voice_alias" : "Paul",
      "gender": "MALE"
    },
    {
      "language": "French",
      "type": "WaveNet",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Wavenet-C",
      "voice_alias" : "Ines",
      "gender": "FEMALE"
    },
    {
      "language": "French",
      "type": "WaveNet",
      "code": "fr-FR",
      "translate" : 'fr',
      "voice": "fr-FR-Wavenet-D",
      "voice_alias" : "Arthur",
      "gender": "MALE"
    },
    {
      "language": "French (Canada)",
      "type": "Standard",
      "code": "fr-CA",
      "translate" : 'fr',
      "voice": "fr-CA-Standard-A",
      "voice_alias" : "Romy",
      "gender": "FEMALE"
    },
    {
      "language": "French (Canada)",
      "type": "Standard",
      "code": "fr-CA",
      "translate" : 'fr',
      "voice": "fr-CA-Standard-B",
      "voice_alias" : "Logan",
      "gender": "MALE"
    },
    {
      "language": "French (Canada)",
      "type": "Standard",
      "code": "fr-CA",
      "translate" : 'fr',
      "voice": "fr-CA-Standard-C",
      "voice_alias" : "Rosa",
      "gender": "FEMALE"
    },
    {
      "language": "French (Canada)",
      "type": "Standard",
      "code": "fr-CA",
      "translate" : 'fr',
      "voice": "fr-CA-Standard-D",
      "voice_alias" : "Felix",
      "gender": "MALE"
    },
    {
      "language": "German",
      "type": "Standard",
      "code": "de-DE",
      "translate" : 'de',
      "voice": "de-DE-Standard-A",
      "voice_alias" : "Hanna",
      "gender": "FEMALE"
    },
    {
      "language": "German",
      "type": "Standard",
      "code": "de-DE",
      "translate" : 'de',
      "voice": "de-DE-Standard-B",
      "voice_alias" : "Finn",
      "gender": "MALE"
    },
    {
      "language": "German",
      "type": "WaveNet",
      "code": "de-DE",
      "translate" : 'de',
      "voice": "de-DE-Wavenet-A",
      "voice_alias" : "Anna",
      "gender": "FEMALE"
    },
    {
      "language": "German",
      "type": "WaveNet",
      "code": "de-DE",
      "translate" : 'de',
      "voice": "de-DE-Wavenet-B",
      "voice_alias" : "Jan",
      "gender": "MALE"
    },
    {
      "language": "German",
      "type": "WaveNet",
      "code": "de-DE",
      "translate" : 'de',
      "voice": "de-DE-Wavenet-C",
      "voice_alias" : "Julia",
      "gender": "FEMALE"
    },
    {
      "language": "German",
      "type": "WaveNet",
      "code": "de-DE",
      "translate" : 'de',
      "voice": "de-DE-Wavenet-D",
      "voice_alias" : "Jonas",
      "gender": "MALE"
    },
    {
      "language": "Italian",
      "type": "Standard",
      "code": "it-IT",
      "translate" : 'it',
      "voice": "it-IT-Standard-A",
      "voice_alias" : "Greta",
      "gender": "FEMALE"
    },
    {
      "language": "Italian",
      "type": "WaveNet",
      "code": "it-IT",
      "translate" : 'it',
      "voice": "it-IT-Wavenet-A",
      "voice_alias" : "Giulia",
      "gender": "FEMALE"
    },
    {
      "language": "Japanese",
      "type": "Standard",
      "code": "ja-JP",
      "translate" : 'ja',
      "voice": "ja-JP-Standard-A",
      "voice_alias" : "Yui",
      "gender": "FEMALE"
    },
    {
      "language": "Japanese",
      "type": "WaveNet",
      "code": "ja-JP",
      "translate" : 'ja',
      "voice": "ja-JP-Wavenet-A",
      "voice_alias" : "Rio",
      "gender": "FEMALE"
    },
    {
      "language": "Korean",
      "type": "Standard",
      "code": "ko-KR",
      "translate" : 'ko',
      "voice": "ko-KR-Standard-A",
      "voice_alias" : "Ji-woo",
      "gender": "FEMALE"
    },
    {
      "language": "Korean",
      "type": "WaveNet",
      "code": "ko-KR",
      "translate" : 'ko',
      "voice": "ko-KR-Wavenet-A",
      "voice_alias" : "Seo-yun",
      "gender": "FEMALE"
    },
    {
      "language": "Portugese (Brazil)",
      "type": "Standard",
      "code": "pt-BR",
      "translate" : 'pt',
      "voice": "pt-BR-Standard-A",
      "voice_alias" : "Maria",
      "gender": "FEMALE"
    },
    {
      "language": "Spanish",
      "type": "Standard",
      "code": "es-ES",
      "translate" : 'es',
      "voice": "es-ES-Standard-A",
      "voice_alias" : "Camila",
      "gender": "FEMALE"
    },
    {
      "language": "Swedish",
      "type": "Standard",
      "code": "sv-SE",
      "translate" : 'sv',
      "voice": "sv-SE-Standard-A",
      "voice_alias" : "Ebba",
      "gender": "FEMALE"
    },
    {
      "language": "Swedish",
      "type": "WaveNet",
      "code": "sv-SE",
      "translate" : 'sv',
      "voice": "sv-SE-Wavenet-A",
      "voice_alias" : "Agnes",
      "gender": "FEMALE"
    },
    {
      "language": "Turkish",
      "type": "Standard",
      "code": "tr-TR",
      "translate" : 'tr',
      "voice": "tr-TR-Standard-A",
      "voice_alias" : "Azra",
      "gender": "FEMALE"
    },
    {
      "language": "Turkish",
      "type": "WaveNet",
      "code": "tr-TR",
      "translate" : 'tr',
      "voice": "tr-TR-Wavenet-A",
      "voice_alias" : "Ecrin",
      "gender": "FEMALE"
    }
  ];

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

  }

  this.getLang = function (input) {
    var filter = function(value) {
      return input.length > 1 && value.toLowerCase().indexOf(input.toLowerCase()) > -1;
    };

    var ret = query("code")
      .filter(filter)
      .on(this.voices);

    if(!ret || !ret.length) return [];
    return ret
  }

}

module.exports = new voiceMap();
