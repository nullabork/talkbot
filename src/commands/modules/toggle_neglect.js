
var langMap = require("../../helpers/langmap").instance;

var command = function (msg, server) {
    if (!msg.ownerIsMaster()) {
        msg.response(server.lang('toggle_neglect.nope'));
        return;
    }

    if (server.toggleNeglect()) {
        msg.response(server.lang('toggle_neglect.none'));
    } else {
        msg.response(server.lang('toggle_neglect.okay'));
    }

};

exports.register = function (commands) {
    commands.add('toggle_neglect', command);
};

exports.unRegister = function (commands) {
    commands.remove('toggle_neglect');
};






