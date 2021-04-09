/*jshint esversion: 9 */

class RuntimeTesting {
  static async TestIfTTSAPIServicesAreConfigured() {
    await require("@services/TextToSpeechService").setupProviders();
  }

  static TestIfNodeOpusIsInstalled() {
    try {
      var opus = require("node-opus");
    } catch (ex) {
      console.log('WARN: npm package "node-opus" is not installed');
      console.log(
        "      This means the bot will use opusscript which runs much slower than node-opus"
      );
      try {
        var opus = require("opusscript");
      } catch (ex2) {
        console.log("Cant find any opus installed");
        process.exit();
      }
    }

    console.log("Loaded Node OPUS OK.");
  }
}

module.exports = RuntimeTesting;
