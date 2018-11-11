/**
 * Command: details
 * will print out users details
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */
function details (msg, server) {
  if (server.isPermitted(msg.user_id)) {
    msg.response(
      JSON.stringify(server.permitted[msg.user_id], null, 4)
    );
  }
};

exports.register = function (commands) {
  commands.add('details', details);
};

exports.unRegister = function (details) {
  commands.remove('details');
};
