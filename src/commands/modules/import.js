var Command = require('@models/Command')
  Common = require('@helpers/common'),
  ini = require('ini-extra');


class Import extends Command {
  execute ({details, server, world}) {
    var comment = "```";

    let out = {
      sfx : server.audioEmojis,
      textrules : server.textrules
    }

    var configString = ini.stringify(out);
    Common.out(configString);

details.response(`
${comment}ini
${configString}
${comment}
`);
  }
}

//registration
exports.register =  (commands) => {
  commands.add(Import.command)
};

exports.unRegister = (commands) => {
  commands.remove(Import.command)
};

exports.Import = Import;
