
var Command = require('@models/Command')
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder');

class TTS extends Command {

  get group () {  return 'control'; }
  get hidden () { return false; }

  execute ({input}) {
    var server = input.server;

    if (!server.inChannel())
      return input.il8nResponse('tts.notinchannel');

    if (!input.ownerIsPermitted())
      return input.il8nResponse('tts.notpermitted');

    server.speak(input.content, input.message.channel, input.message.member);
  }
}

class Mute extends Command {

  get group () {  return 'personalization'; }
  get hidden () { return false; }

  execute ({input}) {
    var server = input.server;
        
    if (( input.ownerIsMaster() || input.ownerCanManageTheServer()) && input.message.mentions.members.size > 0 )
    {
      input.message.mentions.members.forEach( member => server.addMemberSetting(member,'muted',true));
      return input.il8nResponse('mute.okay', {name: input.getDisplayNamesAsCSV() });
    }
    else
    {
      var member = input.message.member;
      server.addMemberSetting(input.message.member,'muted',true);
      return input.il8nResponse('mute.okay', {name: 'you' });
    }
  }
}

class UnMute extends Command {

  get group () {  return 'personalization'; }
  get hidden () { return false; }

  execute ({input}) {
    var server = input.server;
    
    if (( input.ownerIsMaster() || input.ownerCanManageTheServer()) && input.message.mentions.members.size > 0 )
    {
      input.message.mentions.members.forEach( member => server.addMemberSetting(member,'muted',false));
      return input.il8nResponse('unmute.okay', {name: input.getDisplayNamesAsCSV() });
    }
    else
    {
      var member = input.message.member;
      server.addMemberSetting(member,'muted',false);
      return input.il8nResponse('unmute.okay', {name: 'you' });
    }

  }
}

class Stop extends Command {

  get group () {  return 'control'; }
  get hidden () { return true; }

  execute ({input}) {
    var server = input.server;
    
    if ( input.ownerIsPermitted() || input.ownerCanManageTheServer())
    {
      server.stop('requested by stop command');
      return input.il8nResponse('stop.okay');
    }
    else
    {
      return input.il8nResponse('stop.nope');
    }
  }
}

//registration
exports.register =  (commands) => {
  commands.addAll([
    TTS.command,
    Mute.command,
    UnMute.command,
    Stop.command
  ]);
};

exports.unRegister = (commands) => {
  commands.removeAll([
    TTS.command,
    Mute.command,
    UnMute.command,
    Stop.command
  ]);
};

exports.TTS = TTS;
exports.Mute = Mute;
exports.UnMute = UnMute;
exports.Stop = Stop;