/*jshint esversion: 9 */
const Command = require('@models/Command'),
  config = require("@auth"),
  util = require("util"),
  Common = require('@helpers/common');

class Evalo extends Command {

    get group () {  return 'control'; }
    get hidden () { return true; }

    execute ({input}) {
        if (!input.args.length) return input.il8nResponse('evalo.usage');
        if (!input.ownerIsDev()) return input.il8nResponse('evalo.notbotowner');

        const code = input.args.join(" ");
        
        try {
            let client = input.message.client;
            let evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = util.inspect(evaled);
            let msg = evaled;
            if ( evaled.length > 1950 ) 
                evaled = evaled.substr(0,1950);
            input.message.channel.send(this.clean(evaled), {code:"xl"}).catch(err => input.message.channel.send(err.message));
        }
        catch(err) {
            let msg = err.message;
            if ( msg.length > 1900 ) 
                msg = msg.substr(0,1900);
            input.message.channel.send(msg, {code:"xl"}).catch(err => input.message.channel.send(err.message));
        }
    }
    
    clean (text) {
        if (typeof(text) === "string")
            return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
        else
            return text;
    }    
}

//registration
exports.register = (commands) => {
    commands.addAll([
        Evalo.command
    ]);
};
  
exports.unRegister = (commands) => {
    commands.removeAll([
        Evalo.command,
    ]);
};
  
exports.Evalo = Evalo;
