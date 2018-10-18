(function(){
    "use strict"
    exports.escapeRegExp = function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    exports.parseMessageIDs = function(message) {
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

    exports.clamp = function(number, min, max) {
        return Math.min(Math.max(number, min), max);
    };
})();