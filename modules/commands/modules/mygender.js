

var command = function (msg, server) {
  if (msg.args.length == 0) return;

  if (server.isPermitted(msg.user_id)) {
    gender = msg.args[0].trim();
    if (/^(boy|bud|chap|bloke|man|dude|m|male)$/i.test(gender)) {
      gender = "MALE";
    } else if (/^(girl|feminine|lady|gal|women|chick|f|female)$/i.test(gender)) {
      gender = "FEMALE";
    } else {
      gender = "FEMALE";
    }

    server.permitted[msg.user_id].gender = gender;

    msg.response(server.lang('mygender.okay', { gender: gender }));
  } else {
    msg.response(server.lang('mygender.deny'));
  }
};

exports.register = function (commands) {
  commands.add('mygender', command);
};

exports.unRegister = function (commands) {
  commands.remove('mygender');
};
