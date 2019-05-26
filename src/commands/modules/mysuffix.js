/*jshint esversion: 9 */

var Command = require('@models/Command'),
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder');

class MySuffix extends Command {

    get group () {  return 'personalization'; }
    get hidden () { return true; }

    execute ({input}) {
        var server = input.server;
        var member = input.message.member;
        var mysuffix = server.getMemberSetting(member, 'mysuffix') || { suffix: member.displayName, enabled: false };

        if (!input.args.length) return input.il8nResponse('mysuffix.usage', {setting: mysuffix.suffix});

        var mode = input.args[0];
        if (/^(on)$/i.test(mode)) {
            mysuffix.enabled = true;
            server.addMemberSetting(input.message.member, 'mysuffix', mysuffix);
            return input.il8nResponse('mysuffix.on', {setting: mysuffix.suffix});
        } 
        else if (/^(off)$/i.test(mode)) {
            mysuffix.enabled = false;
            server.addMemberSetting(input.message.member, 'mysuffix', mysuffix);
            return input.il8nResponse('mysuffix.off');
        } 
        else if (/^(set)$/i.test(mode)) {
            var a = input.args;
            a.shift();
            mysuffix.suffix = a.join(' ');
            server.addMemberSetting(input.message.member, 'mysuffix', mysuffix);
            input.il8nResponse('mysuffix.setokay', {setting: mysuffix.suffix});
        } 
        else {
            return input.il8nResponse('mysuffix.usage', {setting: mysuffix.suffix});
        }
    }

    onMessage({message, content, modified, server}) {
        var member = message.member;

        var mysuffix = server.getMemberSetting(member, 'mysuffix');
        if (mysuffix && mysuffix.enabled) {
            var suffix = mysuffix.suffix || member.displayName;
            return (modified || content) + ' ' + suffix;
        }
        return null;
    }
}

//registration
exports.register =  (commands) => {
    commands.addAll([
        MySuffix.command
    ]);
};
  
exports.unRegister = (commands) => {
    commands.removeAll([
        MySuffix.command,
    ]);
};
  
exports.MySuffix = MySuffix;
