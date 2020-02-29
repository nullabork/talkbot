/*jshint esversion: 9 */
/**
 * Command: textrule
 * Adds regular expressions to replace text in messages with other text
 *
 * usage !textrule add search text -> replace text
 *       !textrule del search text
 *       !textrule list
 *
 * @param   {[MessageDetails]}  msg     [message releated helper functions]
 *
 * @return  {[undefined]}
 */

var Command = require('@models/Command'),
  CommentBuilder = require('@models/CommentBuilder'),
  auth = require('@auth'),
  Common = require('@helpers/common');

class TextRule extends Command {

  // core COMMAND getters
  get group () {
    return 'server';
  }

  get hidden () {
    return false;
  }

  static testRule(rule) {
    return (new RegExp(textrule, 'gi')).test(rule);
  }

  static addRule({server, find, replacement, regex}) {
    if (!find) return;
    server.addSettings('textrules', {
      [!regex?Common.escapeRegExp(find):find] : replacement
    });
    server.save();
  }

  static addAllRules({server, rules}){
    if(!rules) return;
    server.addSettings('textrules', rules);
    server.save();
  }

  static getCount(server) {
    return Object.keys(server.textrules).length;
  }

  static getRules (server) {
    return server.textrules || {};
  }

  static clearAll (server) {
    server.textrules = {};
    server.save();
  }

  static getRulesArray(server){
    let keys = Object.keys(TextRule.getRules(server)),
      response = [];

    if (keys.length) {
      for (const find of keys) {
        response.push({
          find,
          replacement : server.textrules[find]
        })
      }
    }

    return response;
  }

  static deleteRule({server, find}) {
    if (!find) return;
    delete server.textrules[find];
    server.save();
  }

  execute ({input}) {
    var server = input.server;
    var args = [
        ...input.args
      ],
      rule_command = args.shift(),
      message = args.join(' '),
      opts = message.split('->'),

      find = opts.length > 0 ? opts[0].trim() : null,
      replacement = opts.length > 1 ? opts[1].trim() : null;

    let rules = TextRule.getRules(server);

    /**
     * ADD TEXTRULE
     */
    if(/^(set|add)$/i.test( rule_command ))
    {
      if (!input.ownerCanManageTheServer() && !input.memberCanManageBot())    return input.il8nResponse('textrule.nope');
      if (!find) return input.il8nResponse('textrule.needsFind', { rule_command });
      if (replacement === null || typeof replacement == 'undefined') return input.il8nResponse('textrule.needsReplacement', { find });

      TextRule.addRule({
        server,
        find : find.toLowerCase(),
        replacement
      });

      return input.il8nResponse('textrule.addokay', { find });
    }
     /**
     * ADD TEXTRULE
     */
    if(/^(addRegex|setRegex|setPattern)$/i.test( rule_command ))
    {
      if (!input.ownerCanManageTheServer() && !input.memberCanManageBot())    return input.il8nResponse('textrule.nope');
      if (!find) return input.il8nResponse('textrule.needsFind', { rule_command });
      if (replacement === null || typeof replacement == 'undefined') return input.il8nResponse('textrule.needsReplacement', { find });

      TextRule.addRule({
        server,
        find,
        replacement,
        regex : true
      });

      return input.il8nResponse('textrule.addokay', { find });
    }
    /**
     * LIST TEXTRULE
     */
    else if(/^(list|ls|dir)/i.test( rule_command ))
    {

      if(!TextRule.getCount(server)){
        return input.il8nResponse('textrule.norules');
      }


      let b = CommentBuilder.create({
        data : {
          "_header" : "Your voice text replacements",
          "_data"   : rules
        },
        formatKey : false
      });

      return input.response(b);
    }
    /**
     * REMOVE TEXTRULE
     */
    else if(/^(del|delete|rm|remove)/i.test( rule_command ))
    {
      if (!input.ownerCanManageTheServer() && !input.memberCanManageBot()) return input.il8nResponse('textrule.nope');
      if (!rules[find])                     return input.il8nResponse('textrule.none', { find });

      TextRule.deleteRule({server, find});

      return input.il8nResponse('textrule.delokay', { find });
    }
    /**
     * REMOVE ALL TEXTRULEs
     */
    else if(/^(clearall)/i.test( rule_command ))
    {
      if (!input.ownerCanManageTheServer() && !input.memberCanManageBot()) return input.il8nResponse('textrule.nope');

      TextRule.clearAll(server);
      return input.il8nResponse('textrule.clearallokay', { find });

    }
    /**
     * Somthing should have happened
     */
    else {
      let usage = server.lang('textruleusage.title');
      var command = auth.command_char + this.command_name;

      return input.response(
        CommentBuilder.create({
          data : {
            _heading : usage,
            _data : {
                [command + " add <find> -> <replacement>"]                      : server.lang('textruleusage.command'),
                [command + " addregex <find_pattern> -> <replacement_pattern>"] : server.lang('textruleusage.command_regex'),
                [command + " list"]                                             : server.lang('textruleusage.list'),
                [command + " del <word|emoji>"]                                 : server.lang('textruleusage.del'),
                [command + " clearall"]                                         : server.lang('textruleusage.clearall')
            }
          }
        })
      );
    }
  }

  /**
   * [onMessage event]
   *
   * @param   {[type]}  {message  [the original message object]
   * @param   {[type]}  content   [the original content]
   * @param   {[type]}  modified  [the modified content]
   * @param   {[type]}  server}   [server description]}
   *
   * @return  {[type]}            [return description]
   */
  onMessage({message, content, modified, server}) {
    content = modified || content;
    if(!content) return;

    for ( var textrule in server.textrules ) {
      var re = new RegExp(textrule, 'gi');
      content = content.replace(re, server.textrules[textrule]);
    }
    return content;
  }

}

//registration
exports.register =  (commands) => {
  commands.add(TextRule.command)
};

exports.unRegister = (commands) => {
  commands.remove(TextRule.command)
};

exports.class = TextRule;
