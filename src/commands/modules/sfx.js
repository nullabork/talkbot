/**
 * Command: sfx
 *
 * controls the sfx functionality for messages. Note this command only works for masters
 *
 * usage: !sfx set [emoji_name] [url] - set an emoji. When a permitted person uses this emoji it'll play the sound
 * usage: !sfx del [emoji_name]       - unset an emoji. See set
 * usage: !sfx [url]                  - play a sound url once
 * usage: !sfx list                   - show all emojis available on this server
 * usage: !sfx [emoji_name]           - play this emoji
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 * @param   {[Server]}          server  [Object related to the Server the command was typed in.]
 * @param   {[World]}           world   [Object related to the realm and general bot stuff]
 *
 * @return  {[undefined]}
 */

var Command = require('@models/Command')
  CommentBuilder = require('@models/CommentBuilder'),
  auth = require('@auth'),
  Common = require('@helpers/common');

class SFX extends Command {

  // core COMMAND getters
  get group () {
    return 'server';
  }

  get hidden () {
    return false;
  }


  static addSFX({server, sfx_word, sfx_url}){
    if (!sfx_word || !sfx_url || sfx_url.length < 5 || sfx_url.substring(0, 5) != 'https') return;
    server.audioEmojis[sfx_word] = sfx_url;
    server.save();
  }

  static addAllSFX({server, sfx}){
    if(!sfx) return;
    for (const sfx_word in sfx) {
      if (sfx.hasOwnProperty(sfx_word)) {
        let sfx_url = sfx[sfx_word];

        if (!sfx_word || !sfx_url || sfx_url.length < 5 || sfx_url.substring(0, 5) != 'https') continue;
        server.audioEmojis[sfx_word] = sfx_url;
      }
    }
    server.save();
  }

  static getSFX (server) {
    return server.audioEmojis || {};
  }

  static getCount(server) {
    return Object.keys(server.audioEmojis).length;
  }

  static clearAll (server) {
    server.audioEmojis = {};
    server.save();
  }

  static getSFXArray(server){
    let keys = Object.keys(SFX.getSFX(server)),
      response = [];

    if (keys.length) {
      for (const sfx_word of keys) {
        response.push({
          sfx_word,
          sfx_url : server.audioEmojis[sfx_word]
        })
      }
    }

    return response;
  }

  static deleteSFX(server, key){
    if (!key) return;
    delete server.audioEmojis[key];
    server.save();
  }

  execute ({input, server, world}) {

    var sfx_command = input.args[0],
      sfx_word = input.args[1],
      sfx_url = input.args[2];

    let sfxs = SFX.getSFX(server);

    /**
     * ADD SFX
     */
    if(/^(set|add)/i.test( sfx_command ))
    {
      if (!input.ownerCanManageTheServer())    return input.il8nResponse('sfx.nope');
      if (!sfx_word || Common.isURL(sfx_word)) return input.il8nResponse('sfx.needsWord', { sfx_command });
      if (!sfx_url || !Common.isURL(sfx_url))  return input.il8nResponse('sfx.needsURL', { sfx_word });
      if (sfx_url.substring(0, 5) != 'https')  return input.il8nResponse('sfx.needshttps');

      SFX.addSFX({server,sfx_word,sfx_url});
      return input.il8nResponse('sfx.okay', { sfx_word });
    }
    /**
     * LIST SFX
     */
    else if(/^(list|ls)/i.test( sfx_command ))
    {
      let sfx = SFX.getSFX(server);

      if(!SFX.getCount(server)){
        return input.il8nResponse('sfx.nosfx');
      }


      let b = CommentBuilder.create({
        data : {
          "_header" : "Your server sound effects",
          "_data"   : sfx
        },
        formatKey : false
      });

      return input.response(b);
    }
    /**
     * REMOVE SFX
     */
    else if(/^(del|delete|rm|remove)/i.test( sfx_command ))
    {
      if (!input.ownerCanManageTheServer()) return input.il8nResponse('sfx.nope');
      if (!sfxs[sfx_word])                return input.il8nResponse('sfx.none', {sfx_word});

      SFX.deleteSFX(server,sfx_word);
      return input.il8nResponse('sfx.notnotokay', { sfx_word });

    }
    else if(/^(clearall)/i.test( sfx_command ))
    {
      if (!input.ownerCanManageTheServer()) return input.il8nResponse('sfx.nope');

      SFX.clearAll(server);
      return input.il8nResponse('sfx.clearallokay');

    }
    /**
     * PLAY IF remaining arg is a url or a named sfx
     */
    else if(sfx_command && Common.isURL( sfx_command ))
    {
      server.talk(Common.makeAudioSSML(server.audioEmojis[sfx_command]), server.getUserSettings(input.user_id));
    }
    else if(sfx_command && sfxs[sfx_command])
    {
      server.talk(Common.makeAudioSSML(sfxs[sfx_command]), server.getUserSettings(input.user_id));
    }
    /**
     * Somthing should have happened
     */
    else {
     // \n\n\t:command_charsfx set [word/emoji] [audio file url]\n\t:command_charsfx list\n\t:command_charsfx del [word/emoji]\n\t:command_charsfx [url]\n```
      let usage = server.lang('sfx.usage');
      var command = auth.command_char + this.command_name;

      return input.response(
        CommentBuilder.create({
          data : {
            _heading : usage,
            _data : {
                [command + " add <word|emoji> <soundurl>"]  : server.lang('sfxusage.soundurl'),
                [command + " list"]                         : server.lang('sfxusage.list'),
                [command + " del <word|emoji>"]             : server.lang('sfxusage.del'),
                [command + " <url>"]                        : server.lang('sfxusage.sfx'),
                [command + " clearall"]                     : server.lang('sfxusage.clearall')
            }
          }
        })
      );
    }
  }

  /**
   * [onToken event]
   *
   * @param   {[type]}  {token    [{token word]
   * @param   {[type]}  modified  [modified word that get modified by each event in different commands]
   * @param   {[type]}  server}   [server description]}
   *
   * @return  {[type]}            [return description]
   */
  onToken({token, modified, server}) {
    //other onToken event can overwrite the token before speaking and before other onTokens
    token = modified || token;

    if (server.audioEmojis[token] && server.audioEmojis.hasOwnProperty(token)) {
      return Common.makeAudioSSML(server.audioEmojis[token]);
    }
  }

}

//registration
exports.register =  (commands) => {
  commands.add(SFX.command)
};

exports.unRegister = (commands) => {
  commands.remove(SFX.command)
};

exports.class = SFX;
