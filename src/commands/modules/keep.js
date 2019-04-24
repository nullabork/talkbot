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
 *
 * @return  {[undefined]}
 */

var Command = require('@models/Command')

class Keep extends Command {

  // core COMMAND getters
  get group () { return 'server' }
  get hidden () { return false }

  static addMessageToQueue (server, message) {
    let count = server.getSettingObjectValue('keepMessages', 'count');
    if (count == null || !Number.isInteger(+count)) {
      return
    }

    let queue = server.getSettingObjectValue('keepMessages', 'keepQueue') || [];
    queue.push(message);
    server.addSettings('keepMessages', { keepQueue : queue });
  }

  static cleanup (server, message) {
    let count = server.getSettingObjectValue('keepMessages', 'count');

    if (!count || !Number.isInteger(+count)) {
      return
    }

    let queue = server.getSettingObjectValue('keepMessages', 'keepQueue') || [];

    if (queue.length > +count) {
      let removes = queue.splice(0, queue.length - (+count))
      for (const item of removes) {
        item.delete()
      }
    }

    server.addSettings('keepMessages', { keepQueue : queue});
  }

  execute ({ input, msg }) {
    var server = input.server

    if (!input.args.length) {
      server.addSettings('keepMessages', { count : null });
      return
    }

    if (/^(all)/i.test(input.args[0])) {
      server.addSettings('keepMessages', { count : null });
    }

    if (/^(\d+)$/i.test(input.args[0])) {
      server.addSettings('keepMessages', { count : input.args[0] });
    }
  }

  onMessage ({ message, server }) {
    Keep.addMessageToQueue(server, message)
  }

  onMessageDelivered ({ message, server }) {
    Keep.cleanup(server, message)
  }

}

// registration
exports.register = (commands) => {
  commands.add(Keep.command)
};

exports.unRegister = (commands) => {
  commands.remove(Keep.command)
};

exports.class = Keep
