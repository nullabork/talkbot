/*jshint esversion: 9 */
var Common = require('@helpers/common');

function LangMap(config) {
  //this.codeMap = {};
  var self = this;
  this.defaultLang = {
    name: 'English (US)',
    root: 'en',
    code: 'en-US',
    voices: ['Standard-B', 'Standard-C', 'Standard-D', 'Standard-E', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D', 'Wavenet-E', 'Wavenet-F'],
  };

  this.voices = [
    self.defaultLang,    
    {
      name: 'Danish (Denmark)',
      root: 'da',
      translate : 'da',
      code: 'da-DK',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'Dutch (Netherlands)',
      root: 'nl',
      translate : 'nl',
      code: 'nl-NL',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'English (Australian)',
      root: 'en',
      translate : 'en',
      code: 'en-AU',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'English (British)',
      root: 'en',
      translate : 'en',
      code: 'en-GB',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'French (France)',
      root: 'fr',
      translate : 'fr',
      code: 'fr-FR',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'French (Canada)',
      root: 'fr',
      translate : 'fr',
      code: 'fr-CA',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'German',
      root: 'de',
      translate : 'de',
      code: 'de-DE',
      voices: ['Standard-A', 'Standard-B', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'Italian',
      root: 'it',
      translate: 'it',
      code: 'it-IT',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'Japanese',
      root: 'jp',
      translate: 'ja',
      code: 'ja-JP',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'Korean',
      root: 'ko',
      translate: 'ko',
      code: 'ko-KR',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'Norwegian',
      root: 'nb',
      translate: 'nb',
      code: 'nb-NO',
      voices: ['Standard-E', 'Wavenet-E']
    },
    {
      name: 'Polish',
      root: 'pl',
      translate: 'pl',
      code: 'pl-PL',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Standard-E', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D', 'Wavenet-E']
    },
    {
      name: 'Portuguese (Brazil)',
      root: 'pt',
      translate: 'pt',
      code: 'pt-BR',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'Portuguese (Portugal)',
      root: 'pt',
      translate: 'pt',
      code: 'pt-PT',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'Russian',
      root: 'ru',
      translate: 'ru',
      code: 'ru-RU',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'Slovak',
      root: 'sk',
      translate: 'sk',
      code: 'sk-SK',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: "Spanish",
      root: 'es',
      translate: 'es',
      code: 'es-ES',
      voices: ['Standard-A']
    },
    {
      name: 'Swedish',
      root: 'sv',
      translate: 'sv',
      code: 'sv-SE',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'Turkish',
      root: 'tr',
      translate: 'tr',
      code: 'tr-TR',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Standard-E', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D', 'Wavenet-E']
    },
    {
      name: 'Ukranian',
      root: 'uk',
      translate: 'uk',
      code: 'uk-UA',
      voices: ['Standard-A', 'Wavenet-A']
    }

  ];

  this.getbyFullCode = function (lang) {
    for (var i = 0; i < this.voices.length; i++) {
      var voice = this.voices[i];
      if (voice.code == lang) {
        return voice;
      }
    }

    return null;
  }

  this.get = function (key) {

    var lang = key.split(/\s+/);

    if (!lang || !lang.length) {
      return self.defaultLang;
    }

    var find = Common.escapeRegExp(lang[0]);

    for (var i = 0; i < this.voices.length; i++) {
      var voice = this.voices[i];
      if (new RegExp(find, 'i').test(voice.code)) {
        return voice;
      }
    }

    return self.defaultLang;
  }


}

module.exports = new LangMap();
