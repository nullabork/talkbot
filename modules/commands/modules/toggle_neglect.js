
var langMap = require("../../langmap").instance;

var command = function (msg, server) {
    if ( !msg.ownerIsMaster()) {
        msg.response(server.lang('toggle_neglect.nope'));
    } else {
        server.neglect_neglect = !server.neglect_neglect;
        if ( server.neglect_neglect ) {
            msg.response(server.lang('toggle_neglect.none'));
        } else { 
            msg.response(server.lang('toggle_neglect.okay'));
        }
    }
};

exports.register = function (commands) {
    commands.add('toggle_neglect', command);
  };
  
  exports.unRegister = function(commands){
    commands.remove('toggle_neglect');
  };






