/***************
  
  SSML = require('./discord-to-ssml'),
  var ssml = new SSML({

  });

 ****************/


(function () {
    "use strict"
  
    exports.Language = function (config) {
        this.codeMap = {
            'nl' : { 
                code : 'nl-NL',
                voices : [
                    'Standard-A',
                    'Wavenet-A'
                ],
            },
            'au' : { 
                code : 'en-AU',
                voices : [
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
            'gb' : { 
                code : 'en-GB',
                voices : [
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
            'us' : { 
                code : 'en-US',
                voices : [
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
            'fr' : { 
                code : 'fr-FR',
                voices : [
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
            'ca' : { 
                code : 'fr-CA',
                voices : [
                    'Standard-A',
                    'Standard-B',
                    'Standard-C',
                    'Standard-D'
                ],
            },
            'de' : { 
                code : 'de-DE',
                voices : [
                    'Standard-A',
                    'Standard-B',
                    'Wavenet-A',
                    'Wavenet-B',
                    'Wavenet-C',
                    'Wavenet-D'
                ],
            },
            'it' : { 
                code : 'it-IT',
                voices : [
                    'Standard-A',
                    'Wavenet-A'
                ],
            },
            'jp' : { 
                code : 'ja-JP',
                voices : [
                    'Standard-A',
                    'Wavenet-A'
                ],
            },
            'ko' : { 
                code : 'ko-KR',
                voices : [
                    'Standard-A',
                    'Wavenet-A'
                ],
            },
            'br' : { 
                code : 'pt-BR',
                voices : [
                    'Standard-A'
                ],
            },
            'es' : { 
                code : 'es-ES',
                voices : [
                    'Standard-A'
                ],
            },
            'se' : { 
                code : 'sv-SE',
                voices : [
                    'Standard-A'
                ],
            },
            'tr' : 'tr-TR'
        };

        
    }
  
  })();


  Dutch (Netherlands)	Standard	nl-NL	nl-NL-Standard-A	FEMALE
Dutch (Netherlands)	WaveNet	nl-NL	nl-NL-Wavenet-A	FEMALE
English (Australia)	Standard	en-AU	en-AU-Standard-A	FEMALE
English (Australia)	Standard	en-AU	en-AU-Standard-B	MALE
English (Australia)	Standard	en-AU	en-AU-Standard-C	FEMALE
English (Australia)	Standard	en-AU	en-AU-Standard-D	MALE
English (Australia)	WaveNet	en-AU	en-AU-Wavenet-A	FEMALE
English (Australia)	WaveNet	en-AU	en-AU-Wavenet-B	MALE
English (Australia)	WaveNet	en-AU	en-AU-Wavenet-C	FEMALE
English (Australia)	WaveNet	en-AU	en-AU-Wavenet-D	MALE
English (UK)	Standard	en-GB	en-GB-Standard-A	FEMALE
English (UK)	Standard	en-GB	en-GB-Standard-B	MALE
English (UK)	Standard	en-GB	en-GB-Standard-C	FEMALE
English (UK)	Standard	en-GB	en-GB-Standard-D	MALE
English (UK)	WaveNet	en-GB	en-GB-Wavenet-A	FEMALE
English (UK)	WaveNet	en-GB	en-GB-Wavenet-B	MALE
English (UK)	WaveNet	en-GB	en-GB-Wavenet-C	FEMALE
English (UK)	WaveNet	en-GB	en-GB-Wavenet-D	MALE
English (US)	Standard	en-US	en-US-Standard-B	MALE
English (US)	Standard	en-US	en-US-Standard-C	FEMALE
English (US)	Standard	en-US	en-US-Standard-D	MALE
English (US)	Standard	en-US	en-US-Standard-E	FEMALE
English (US)	WaveNet	en-US	en-US-Wavenet-A	MALE
English (US)	WaveNet	en-US	en-US-Wavenet-B	MALE
English (US)	WaveNet	en-US	en-US-Wavenet-C	FEMALE
English (US)	WaveNet	en-US	en-US-Wavenet-D	MALE
English (US)	WaveNet	en-US	en-US-Wavenet-E	FEMALE
English (US)	WaveNet	en-US	en-US-Wavenet-F	FEMALE
French	Standard	fr-FR	fr-FR-Standard-A	FEMALE
French	Standard	fr-FR	fr-FR-Standard-B	MALE
French	Standard	fr-FR	fr-FR-Standard-C	FEMALE
French	Standard	fr-FR	fr-FR-Standard-D	MALE
French	WaveNet	fr-FR	fr-FR-Wavenet-A	FEMALE
French	WaveNet	fr-FR	fr-FR-Wavenet-B	MALE
French	WaveNet	fr-FR	fr-FR-Wavenet-C	FEMALE
French	WaveNet	fr-FR	fr-FR-Wavenet-D	MALE
French (Canada)	Standard	fr-CA	fr-CA-Standard-A	FEMALE
French (Canada)	Standard	fr-CA	fr-CA-Standard-B	MALE
French (Canada)	Standard	fr-CA	fr-CA-Standard-C	FEMALE
French (Canada)	Standard	fr-CA	fr-CA-Standard-D	MALE
German	Standard	de-DE	de-DE-Standard-A	FEMALE
German	Standard	de-DE	de-DE-Standard-B	MALE
German	WaveNet	de-DE	de-DE-Wavenet-A	FEMALE
German	WaveNet	de-DE	de-DE-Wavenet-B	MALE
German	WaveNet	de-DE	de-DE-Wavenet-C	FEMALE
German	WaveNet	de-DE	de-DE-Wavenet-D	MALE
Italian	Standard	it-IT	it-IT-Standard-A	FEMALE
Italian	WaveNet	it-IT	it-IT-Wavenet-A	FEMALE
Japanese	Standard	ja-JP	ja-JP-Standard-A	FEMALE
Japanese	WaveNet	ja-JP	ja-JP-Wavenet-A	FEMALE
Korean	Standard	ko-KR	ko-KR-Standard-A	FEMALE
Korean	WaveNet	ko-KR	ko-KR-Wavenet-A	FEMALE
Portugese (Brazil)	Standard	pt-BR	pt-BR-Standard-A	FEMALE
Spanish	Standard	es-ES	es-ES-Standard-A	FEMALE
Swedish	Standard	sv-SE	sv-SE-Standard-A	FEMALE
Turkish	Standard	tr-TR	tr-TR-Standard-A	FEMALE