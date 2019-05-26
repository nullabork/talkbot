/*jshint esversion: 9 */

class RuntimeTesting {

  static TestIfChildProcessIsWorkingHowDiscordJSNeedsItTo() {
    // run this to test if you need a different version of node

    var ChildProc = require('child_process');
    var players = ["ffmpeg", "avconv"];

    function chooseAudioEncoder(players) {
      if (!players[0]) return null;
      var s = ChildProc.spawnSync(players.shift());
      return s.error ? chooseAudioEncoder(players) : s.file;
    }

    if (!chooseAudioEncoder(players)) {
      console.log("Failed to load either ffmpeg or avconv");
      console.log("Either these aren't installed OR");
      console.log("You need a different version of nodejs. The module child_process may doesn't play well with your node version. This software was developed using node v8.11.0");
      process.exit();
    }
    else {
      console.log("Loaded FFMPEG OK.");
    }
  }
  
  static async TestIfTTSAPIServicesAreConfigured() {
    await require("@services/TextToSpeechService").setupProviders();
  }
  
  static TestIfNodeOpusIsInstalled() {

    try {
      var opus = require('node-opus');
    }
    catch(ex)
    {
      console.log('WARN: npm package "node-opus" is not installed');
      console.log('      This means the bot will use opusscript which runs much slower than node-opus');
      try {
        var opus = require('opusscript');
      }
      catch(ex2) {
        console.log('Cant find any opus installed');
        process.exit();
      }
    }

    console.log("Loaded Node OPUS OK.");
  }
};

module.exports = RuntimeTesting;
