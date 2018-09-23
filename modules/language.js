(function () {
  "use strict"

  exports.Language = function (config) {
    this.codeMap = {
      'nl': {
        code: 'nl-NL',
        voices: [
          'Standard-A',
          'Wavenet-A'
        ],
      },
      'au': {
        code: 'en-AU',
        voices: [
          'Standard-A',
          'Standard-B',
          'Standard-C',
          'Standard-D',
          'Wavenet-A',
          'Wavenet-B',
          'Wavenet-C',
          'Wavenet-D'
        ],
      },
      'gb': {
        code: 'en-GB',
        voices: [
          'Standard-A',
          'Standard-B',
          'Standard-C',
          'Standard-D',
          'Wavenet-A',
          'Wavenet-B',
          'Wavenet-C',
          'Wavenet-D'
        ],
      },
      'us': {
        code: 'en-US',
        voices: [
          'Standard-B',
          'Standard-C',
          'Standard-D',
          'Wavenet-A',
          'Wavenet-B',
          'Wavenet-C',
          'Wavenet-D',
          'Wavenet-E',
          'Wavenet-F'
        ],
      },
      'fr': {
        code: 'fr-FR',
        voices: [
          'Standard-A',
          'Standard-B',
          'Standard-C',
          'Standard-D',
          'Wavenet-A',
          'Wavenet-B',
          'Wavenet-C',
          'Wavenet-D'
        ],
      },
      'ca': {
        code: 'fr-CA',
        voices: [
          'Standard-A',
          'Standard-B',
          'Standard-C',
          'Standard-D'
        ],
      },
      'de': {
        code: 'de-DE',
        voices: [
          'Standard-A',
          'Standard-B',
          'Wavenet-A',
          'Wavenet-B',
          'Wavenet-C',
          'Wavenet-D'
        ],
      },
      'it': {
        code: 'it-IT',
        voices: [
          'Standard-A',
          'Wavenet-A'
        ],
      },
      'jp': {
        code: 'ja-JP',
        voices: [
          'Standard-A',
          'Wavenet-A'
        ],
      },
      'ko': {
        code: 'ko-KR',
        voices: [
          'Standard-A',
          'Wavenet-A'
        ],
      },
      'br': {
        code: 'pt-BR',
        voices: [
          'Standard-A'
        ],
      },
      'es': {
        code: 'es-ES',
        voices: [
          'Standard-A'
        ],
      },
      'se': {
        code: 'sv-SE',
        voices: [
          'Standard-A'
        ],
      },
      'tr': 'tr-TR'
    };
  }
})();