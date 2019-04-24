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

var Command = require('@models/Command')
  CommentBuilder = require('@models/CommentBuilder'),
  auth = require('@auth'),
  Common = require('@helpers/common');

class Restrict extends Command {

  // core COMMAND getters
  get group () {
    return 'server';
  }

  get hidden () {
    return false;
  }

  getRestrictionString(server) {
    var csv = '';
    if ( !server.restrictions || server.restrictions.length == 0) return 'none';
    for (var index in server.restrictions) {
      var chan = server.guild.channels.find(x => x.id == server.restrictions[index]);
      if ( chan) csv += ', #' + chan.name;
    }
    return csv.substring(2);
  }

  usage(input, server) {
    let usage = server.lang('restrictusage.title');
    var command = auth.command_char + this.command_name;

    return input.response(
      CommentBuilder.create({
        data : {
          _heading : usage,
          _description: server.lang('restrictusage.description', {restrictions: this.getRestrictionString(server)}),
          _data : {
            [command]                            : server.lang('restrictusage.noargs'),
            [command + " none"]                  : server.lang('restrictusage.none'),
            [command + " channel1 channel2 etc"] : server.lang('restrictusage.channels'),
          }
        }
      })
    );
  }

  execute ({input}) {
    var server = input.server;

    if (input.args.length == 0) {
      this.usage(input, server);
      return;
    }

    if (!input.ownerCanManageTheServer()) {
      input.il8nResponse('restrict.nopermissions');
      return;
    }

    var restriction_identifier = input.args[0];

    if(/^(none|default)$/i.test( restriction_identifier )) {
      server.restrictions = [];
      input.il8nResponse('restrict.setdefault');
    }
    else if ( input.message.mentions.channels.size == 0 ) {
      input.il8nResponse('restrict.args');
    } 
    else {
      input.message.mentions.channels.tap( chan => server.restrictions.push(chan.id) );
      var chans = Common.makeNiceCsv(input.message.mentions.channels, item => item.name);
      input.il8nResponse('restrict.okay', {channels: chans});
    }
  };

  /**
   * [onMessage event]
   *
   * @param   {[type]}  {message  [the original discord.js message object]
   * @param   {[type]}  content   [the message content]
   * @param   {[type]}  modified  [the modified content]
   * @param   {[type]}  server}   [server description]}
   *
   * @return  {[type]}            [return description]
   */
  onValidate({message, server}) {
    if ( server.restrictions.length > 0 && !server.restrictions.includes(message.channel.id) ) {
      return false; // nerf the message
    }
    return true; // accept the message
  }
}

//registration
exports.register =  (commands) => {
  commands.add(Restrict.command)
};

exports.unRegister = (commands) => {
  commands.remove(Restrict.command)
};

exports.class = Restrict;
