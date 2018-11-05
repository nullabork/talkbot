var botStuff = require('./bot-stuff');

class Common {
    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    static isURL(url, opts) {
        // message.replace(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/g, "")

        // var regex = "[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?"

        
        // var protocol = "(";
        // if (opts.https) {
        //     protocol += 'https:\/\/)';
        // } else {
        //     protocol += 'http:\/\/)';
        // }

        // if (opts.protocol) {
        //     protocol += "{1}";
        // } else {
        //     protocol += "{0,1}";
        // }
//s
    }

    static messageIDs(message) {
        var user_ids = message.match(/<@!{0,1}(\d{12,19})>/g);
        //user_ids.channel_id

        if (!user_ids) return [];

        var map = user_ids.map(function (element) {
            var tt = element.replace(/<[@#]{0,1}[!&]{0,1}(\d{12,19})>/g, function (a, b) {
                return b;
            });

            return  tt;
        });

        return map;
    }

    static isMessageExcluded(message) {
        return message.startsWith('```');
    }

    static numberClamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    }

    static caseToSpace(nick_name) {
        return nick_name.replace(/([a-z])([A-Z])/g, function (a, b, c) {
            return b + " " + c;
        });
    };

    static resolveDiscordSnowflakes(channel_id, message) {
        return message.replace(/<[@#]{0,1}[!&]{0,1}(\d{12,19})>/g, function (match, entity_id) {
            var name = botStuff.findThingsName(channel_id, entity_id);
            return Common.caseToSpace(name);
        });
    };


}

module.exports = Common;
