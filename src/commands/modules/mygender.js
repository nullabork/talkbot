
/**
 * Command: mygender
 * sets your gender user config
 *
 * usage !mygender male
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}  server  [Object related to the Server the command was typed in.]
 * @param   {[World]}  world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

function mygender(msg, server, world) {
  if (msg.args.length == 0) return;

  if (server.isPermitted(msg.user_id)) {
    gender = msg.getMessage().trim();
    if (/^(boy|bud|chap|bloke|man|dude|m|male)$/i.test(gender)) {
      gender = "MALE";
    } else if (/^(girl|feminine|lady|gal|women|chick|f|female)$/i.test(gender)) {
      gender = "FEMALE";
    } else if (!server.permitted[msg.user_id].gender) {
      gender = "FEMALE";
    }

    server.permitted[msg.user_id].gender = gender;

    msg.response(server.lang('mygender.okay', { gender: gender }));
  } else {
    msg.response(server.lang('mygender.deny'));
  }
};

exports.register = function (commands) {
  commands.add('mygender', mygender);
};

exports.unRegister = function (commands) {
  commands.remove('mygender');
};
