var Common = require('@helpers/Common');

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
      root: 'nl',
      code: 'nl-NL',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      root: 'en',
      code: 'en-AU',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      root: 'en',
      code: 'en-GB',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      root: 'fr',
      code: 'fr-FR',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      root: 'fr',
      code: 'fr-CA',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D']
    },
    {
      root: 'de',
      code: 'de-DE',
      voices: ['Standard-A', 'Standard-B', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      root: 'it',
      code: 'it-IT',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      root: 'jp',
      code: 'ja-JP',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      root: 'ko',
      code: 'ko-KR',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      root: 'pt',
      code: 'pt-BR',
      voices: ['Standard-A']
    },
    {
      root: 'es',
      code: 'es-ES',
      voices: ['Standard-A']
    },
    {
      root: 'sv',
      code: 'sv-SE',
      voices: ['Standard-A']
    },
    {
      root: 'tr',
      code: 'tr-TR',
      voices: ['Standard-A']
    }

  ];

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
