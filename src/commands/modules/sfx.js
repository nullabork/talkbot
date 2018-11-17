
/**
 * Command: sfx
 *
 * controls the sfx functionality for messages. Note this command only works for masters
 *
 * usage: !sfx set [emoji_name] [url] - set an emoji. When a permitted person uses this emoji it'll play the sound
 * usage: !sfx del [emoji_name]       - unset an emoji. See set
 * usage: !sfx [url]                  - play a sound url once
 * usage: !sfx list                   - show all emojis available on this server 
 * usage: !sfx [emoji_name]           - play this emoji            
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

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
    server.talk(common.makeAudioSSML(msg.message), server.permitted[msg.user_id]);
  }
  else {
   
    if (!server.audioEmojis) server.audioEmojis = {};
    
    // i cant even
    if (msg.args.length > 3) msg.response(server.lang('sfx.noper'));
    
    // multiple commands 
    else if (msg.args.length == 1) {
            
      var sfx_command = msg.args[0]; 
            
      // wtf
      if ( !sfx_command ) msg.response(server.lang('sfx.nosfx'));

      // list all the SFX available
      else if ( sfx_command == 'list' ) msg.response(JSON.stringify(server.audioEmojis));

      // play a specific SFX
      else if (server.audioEmojis[sfx_command]) 
        server.talk(common.makeAudioSSML(server.audioEmojis[sfx_command]), server.permitted[msg.user_id]);
    }
    
    // delete an emoji from this server 
    else if (msg.args.length == 2) {
      if ( msg.args[0] != 'del' || msg.args[0] != 'delete' || msg.args[0] != 'rm' || msg.args[0] != 'remove' ) msg.response(server.lang('sfx.nodelete'));
      var emoji_name = msg.args[1];
      delete server.audioEmojis[emoji_name];
      world.save();
    }
    
    // set an emoji on this server 
    else { 
      if ( msg.args[0] != 'set' ) msg.response(server.lang('sfx.noset'));
      var emoji_name = msg.args[1];
      var emoji_url = msg.args[2];
      server.audioEmojis[emoji_name] = emoji_url;
      world.save();
    }
    
  }
};

// listen to the normal text flow, if an emoji we have a sound for pops up, play it
function sfxPlaySoundListener(message, user_id, server, world) {
  
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
  commands.addListener('sfx.msg.args', sfxPlaySoundListener);
};

exports.unRegister = function (commands) {
  commands.removeListener('sfx.msg.args');
  commands.remove('sfx');
};
