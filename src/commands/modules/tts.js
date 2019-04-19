
var Command = require('@models/Command')
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder');

class TTS extends Command {

  get group () {  return 'control'; }
  get hidden () { return false; }

  execute ({input, server, world}) {
    if ( input.message.length < 1 ) return;
    if ( Common.isMessageExcluded(input.message) ) return;

    if (!server.inChannel())
      return input.il8nResponse('tts.notinchannel');

    if (!server.isPermitted(input.user_id))
      return input.il8nResponse('tts.notpermitted');

    server.speak(input.message, input.channel_id, input.user_id, world);
  }
}

class Mute extends Command {

  get group () {  return 'personalization'; }
  get hidden () { return false; }

  execute ({input, server, world}) {
    var target_ids = [input.user_id];
    
    if (( input.ownerIsMaster() || input.ownerCanManageTheServer()) && input.getUserIds().length > 0 )
    {
      target_ids = input.getUserIds();
    }
        
    for ( var target_id in target_ids ) {
      if (server.getUserSetting(target_id, 'muted'))
        return input.il8nResponse('mute.alreadymuted');

      server.addUserSetting(target_id,'muted',true);
    }
    return input.il8nResponse('mute.okay');
  }
}

class UnMute extends Command {

  get group () {  return 'personalization'; }
  get hidden () { return false; }

  execute ({input, server, world}) {
    var target_ids = [input.user_id];
    
    if (( input.ownerIsMaster() || input.ownerCanManageTheServer()) && input.getUserIds().length > 0 )
    {
      target_ids = input.getUserIds();
    }
        
    for ( var target_id in target_ids ) {
      if (!server.getUserSetting(target_id, 'muted'))
        return input.il8nResponse('unmute.alreadyunmuted');

      server.addUserSetting(target_id,'muted',false);
    }
    return input.il8nResponse('unmute.okay');
  }
}

//registration
exports.register =  (commands) => {
  commands.addAll([
    TTS.command,
    Mute.command,
    UnMute.command
  ]);
};

exports.unRegister = (commands) => {
  commands.removeAll([
    TTS.command,
    Mute.command,
    UnMute.command
  ]);
};

exports.TTS = TTS;
exports.Mute = Mute;
exports.UnMute = UnMute;
