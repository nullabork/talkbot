/*jshint esversion: 9 */
require('module-alias/register');
var tests = require("@helpers/runtime-testing.js"),
  fs = require('fs'),
  tts = require("@services/TextToSpeechService");

function saveVoice(service, r, voice) {
  service.getAudioContent(r, voice.voice, (err,audio) => {
  });
}
tests.TestIfChildProcessIsWorkingHowDiscordJSNeedsItTo();

(async () => {
  await tts.setupProviders();

  setTimeout(() => {
      var service = tts.providers['azure'];
      var voices = service.getVoices();

      for ( var idx in voices )
      {
        var voice = voices[idx];
        var r = service.buildRequest("You are hearing me talk", {name: voice.voice}, {});
        saveVoice(service, r, voice);
      }
  }, 10000);
})();

setTimeout(() => console.log('exiting'), 200000);