function makeAudioSSML(url) {
  var ssml = "<speak><audio src='" + url + "' /></speak>";
  return ssml;
};

function sfx(msg, server, world) {

  if (!msg.ownerIsMaster()) {
    msg.response(server.lang('sfx.nope'));
    return;
  }

  if (!msg.message) {
    msg.response(server.lang('sfx.nope'));
    return;
  }

  if (common.isURL(msg.message)) {
    server.talk(makeAudioSSML(msg.message), server.permitted[msg.user_id]);
  }
  else {
   
    if (!server.audioEmojis) server.audioEmojis = {};
    if (msg.args.length == 1) {
            
      var sfx_command = msg.args[0]; 
            
      if ( !sfx_command ) msg.response(server.lang('sfx.nosfx'));
      // list all the SFX available
      else if ( sfx_command == 'list' ) msg.response(JSON.stringify(server.audioEmojis));
      // play a specific SFX
      else if (server.audioEmojis[sfx_command]) 
        server.talk(makeAudioSSML(server.audioEmojis[sfx_command]), server.permitted[msg.user_id]);
    }
    else if (msg.args.length > 2) msg.response(server.lang('sfx.noper'));
    else { // set an emoji
      var emoji_command = msg.args[0];
      var emoji_url = msg.args[1];
      
      server.audioEmojis[emoji_command] = emoji_url;
      
      world.save();
    }
  }
};

// listen to the normal text flow, if an emoji we have a sound for pops up, play it
function sfxPlaySound(message, user_id, server, world) {
  
  if ( !server.isPermitted(user_id)) return;

  var parts = message.split(' ');
  
  for (var part in parts ) {
    var emoji = parts[part];
    if ( server.audioEmojis[emoji])
      server.talk(makeAudioSSML(server.audioEmojis[emoji]), server.permitted[user_id]);
  }
};

exports.register = function (commands) {
  commands.add('sfx', sfx);
  commands.addListener('sfx.msg.args', sfxPlaySound);
};

exports.unRegister = function (commands) {
  commands.removeListener('sfx.msg.args');
  commands.remove('sfx');
};
