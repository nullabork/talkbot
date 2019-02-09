var Common = require('@helpers/common');

function LangMap(config) {
  //this.codeMap = {};
  var self = this;
  this.defaultLang = {
    root: 'en',
    code: 'en-US',
    voices: ['Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D', 'Wavenet-E', 'Wavenet-F']
  };

  this.voices = [
    self.defaultLang,
    {
      name: 'Dutch',
      root: 'nl',
      translate : 'nl',
      code: 'nl-NL',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'English',
      root: 'en',
      translate : 'en',
      code: 'en-AU',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'English',
      root: 'en',
      translate : 'en',
      code: 'en-GB',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'French',
      root: 'fr',
      translate : 'fr',
      code: 'fr-FR',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      name: 'French',
      root: 'fr',
      translate : 'fr',
      code: 'fr-CA',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D']
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
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      name: 'Portuguese',
      root: 'pt',
      translate: 'pt',
      code: 'pt-BR',
      voices: ['Standard-A']
    },
    {
      name: "Spanish",
      root: 'es',
      translate: 'es',
      code: 'es-ES',
      voices: ['Standard-A']
    },
    {
      root: 'sv',
      translate: 'sv',
      name: 'Swedish',
      code: 'sv-SE',
      voices: ['Standard-A']
    },
    {
      name: 'Turkish',
      root: 'tr',
      translate: 'tr',
      code: 'tr-TR',
      voices: ['Standard-A']
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
