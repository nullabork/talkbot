class Common {
    static escapeRegExp (string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    static messageIDs (message) {
        var user_ids = message.match(/<@!{0,1}(\d{12,19})>/g);
        //user_ids.channel_id

        if(!user_ids) return [];

        user_ids.map(function(element) {
            return element.replace(/<@!{0,1}(\d{12,19})>/g, function(a,b) {
                return b;
            });
        });

        return user_ids;
    }

    static messageExcluded (message) {
        return message.startsWith('```');
    }

    static numberClamp (number, min, max) {
        return Math.min(Math.max(number, min), max);
    }

    static caseToSpace( nick_name ) {
        return nick_name.replace(/([a-z])([A-Z])/g, function(a,b,c){
            return b + " " + c;
        });
    };


}

module.exports = Common;
