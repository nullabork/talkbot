
class RuntimeTesting {

  static TestIfChildProcessIsWorkingHowDiscordIONeedsItTo() {
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
      console.log("Loaded a player OK.");
    }
  }
  
  static TestIfGoogleEnvironmentVarIsSet() {
    if(!process.env.GOOGLE_APPLICATION_CREDENTIALS) { 
      console.log('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. It should be set to a file path containing the Google API key.'); 
      process.exit();
    }
    
    var auth = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    if ( !auth.type || !auth.project_id || !auth.private_key_id || !auth.private_key || !auth.client_email || !auth.client_id || !auth.auth_uri || !auth.token_uri || !auth.auth_provider_x509_cert_url || !auth.client_x509_cert_url )
    {
      console.log("The Google API authentication file at " + process.env.GOOGLE_APPLICATION_CREDENTIALS + " appears to be malformed");
      process.exit();
    }    
    
    console.log("Loaded a the Google TTS API credentials OK.");    
  }
};

module.exports = RuntimeTesting;
