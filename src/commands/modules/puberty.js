/*jshint esversion: 9 */

var Command = require('@models/Command'),
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder');

class Puberty extends Command {

    get group () {  return 'personalization'; }
    get hidden () { return true; }

    execute ({input}) {
        var server = input.server;
        var member = input.message.member;
        var currentMode = server.getMemberSetting(member, 'puberty') || 'off';

        if (!input.args.length) return input.il8nResponse('puberty.usage', {setting: currentMode});

        var mode = input.args[0];
        if (/^(on)$/i.test(mode)) {
            mode = "on";
        } else if (/^(off)$/i.test(mode)) {
            mode = "off";
        } else {
            return input.il8nResponse('puberty.usage', {setting: currentMode});
        }

        server.addMemberSetting(input.message.member, 'puberty', mode);

        if ( mode == "on") return input.il8nResponse('puberty.on');
        input.il8nResponse('puberty.off');
    }

    onConfigureVoice({message, server, original_settings}) {

        var settings = server.world.lastSettings;

        if ( original_settings.pitch || original_settings.speed )
            server.world.lastSettings =  Object.assign({}, original_settings); 

        if ( settings && server.getMemberSetting(message.member, 'puberty') == "on")
        {
            if ( settings.pitch )
                original_settings.pitch = settings.pitch;
            if ( settings.speed )
                original_settings.speed = settings.speed;
            return original_settings;        
        }
        return null;
    }
}

//registration
exports.register =  (commands) => {
    commands.addAll([
        Puberty.command
    ]);
};
  
exports.unRegister = (commands) => {
    commands.removeAll([
        Puberty.command,
    ]);
};
  
exports.Puberty = Puberty;
