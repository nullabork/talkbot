/*jshint esversion: 9 */

var Command = require('@models/Command'),
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder');

class TTS extends Command {

  get group () {  return 'control'; }
  get hidden () { return false; }

  execute ({input}) {
    var server = input.server;

    if (!server.isBound())
      return input.il8nResponse('tts.notinchannel');

    if (!server.inChannel())
      return input.il8nResponse('tts.notinchannel');

    if (!input.ownerIsPermitted())
      return input.il8nResponse('tts.notpermitted');

    if (!input.message.member)
      return input.il8nResponse('tts.mustbeinchannel');

    server.speak(input.message);
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

    if ( !input.server.inChannel()) return;
    if (!(input.ownerIsPermitted() || input.ownerCanManageTheServer()))
    {
      return input.il8nResponse('stop.nope');
    }

    var firstArg = input.args && input.args.length? input.args[0] : "";

    if (/^(all)/i.test(firstArg)) {
      server.stop('stop all requested by stop command', true);
      return input.il8nResponse('stop.okayAll');
    } else {
      server.stop('stop requested by stop command');
      return input.il8nResponse('stop.okay');
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
