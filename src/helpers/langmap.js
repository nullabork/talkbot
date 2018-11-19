var common = require('@helpers/common');

function LangMap(config) {
  //this.codeMap = {};
  var self = this;
  this.defaultLang = {
    code: 'en-US',
    voices: ['Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D', 'Wavenet-E', 'Wavenet-F']
  };

  this.voices = [
    self.defaultLang,
    {
      code: 'nl-NL',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      code: 'en-AU',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      code: 'en-GB',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      code: 'fr-FR',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      code: 'fr-CA',
      voices: ['Standard-A', 'Standard-B', 'Standard-C', 'Standard-D']
    },
    {
      code: 'de-DE',
      voices: ['Standard-A', 'Standard-B', 'Wavenet-A', 'Wavenet-B', 'Wavenet-C', 'Wavenet-D']
    },
    {
      code: 'it-IT',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      code: 'ja-JP',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      code: 'ko-KR',
      voices: ['Standard-A', 'Wavenet-A']
    },
    {
      code: 'pt-BR',
      voices: ['Standard-A']
    },
    {
      code: 'es-ES',
      voices: ['Standard-A']
    },
    {
      code: 'sv-SE',
      voices: ['Standard-A']
    },
    {
      code: 'tr-TR',
      voices: ['Standard-A']
    }

  ];

  this.get = function (key) {

    var lang = key.split(/\s+/);

    if (!lang || !lang.length) {
      return self.defaultLang;
    }

    var find = common.escapeRegExp(lang[0]);

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
