var Command = require('@models/Command')
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder'),
  fetch = require('fetch'),
  SFX = require('./sfx').class,
  TextRule = require('./textrule').class,
  ini = require('ini-extra');


class Import extends Command {
  execute ({input, server, world}) {
    if (!input.ownerCanManageTheServer()) return input.il8nResponse('general.nope');

    let import_url = input.args[0];

    if(import_url && Common.isURL(import_url)){
      fetch.fetchUrl(import_url, function(error, meta, body){

        var json = ini.parse(body.toString());

        if(error){
          return input.il8nResponse('import.error');
        }

        if(!json || !json.sfx && !json.textrules) {
          return input.il8nResponse('import.invalid', { "supports" : "[textrules] and [sfx]"});
        }

        if(json.sfx) {
          SFX.addAllSFX({
            server,
            sfx : json.sfx
          });
        }

        if(json.textrules) {
          TextRule.addAllRules({
            server,
            rules : json.textrules
          });
        }

        return input.il8nResponse('import.imported');

      });
    }
  }
}

//registration
exports.register =  (commands) => {
  commands.add(Import.command)
};

exports.unRegister = (commands) => {
  commands.remove(Import.command)
};

exports.class = Import;
