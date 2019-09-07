/*jshint esversion: 9 */
const Command = require('@models/Command'),
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder'),
  Chat = require('tmi.js');

class Twitch extends Command {

    get group () {  return 'control'; }
    get hidden () { return true; }

    execute ({input}) {
        var server = input.server;

        if (!input.args.length) return input.il8nResponse('twitch.usage');

        if (!server.twitch) server.twitch = {};

        var subcommand = input.args[0];

        if (/^(link)$/i.test(subcommand)) {

          var twitch_channel = input.args[1];
          if (!server.isBound()) return input.il8nResponse('twitch.notbound');
          if (!input.ownerIsMaster()) return input.il8nResponse('twitch.notmaster');
        
          var link = this.openTwitchChatLink(server, twitch_channel);
          server.twitch[twitch_channel] = {link: link, permitted: {}};
          return input.il8nResponse('twitch.linked', {twitch_channel: twitch_channel});
        } 

        else if (/^(unlink)$/i.test(subcommand)) {
          var twitch_channel = input.args[1];
          if ( !server.twitch[twitch_channel]) return input.il8nResponse('twitch.notlinked', {twitch_channel: twitch_channel});
          var link = server.twitch[twitch_channel].link;
          link.disconnect();
          delete server.twitch[twitch_channel];
          return input.il8nResponse('twitch.unlinked', {twitch_channel: twitch_channel});
        } 

        else if (/^(permit)$/i.test(subcommand)) {
          var twitch_channel = input.args[1];
          var who = input.args[2];

          if (!who ) return input.il8nResponse('twitch.permitwho', {twitch_channel: twitch_channel});
          if (who == 'mods') server.twitch[twitch_channel].permitted._mods = true;
          else if (who == 'subs') server.twitch[twitch_channel].permitted._subs = true;
          else if (who == 'all') server.twitch[twitch_channel].permitted._all = true;
          else server.twitch[twitch_channel].permitted[who] = true;

          return input.il8nResponse('twitch.permitokay', {who: who});
        }

        else if (/^(unpermit)$/i.test(subcommand)) {
          var twitch_channel = input.args[1];
          var who = input.args[2];

          if (!who ) return input.il8nResponse('twitch.unpermitwho', {twitch_channel: twitch_channel});
          if (who == 'mods') server.twitch[twitch_channel].permitted._mods = false;
          else if (who == 'subs') server.twitch[twitch_channel].permitted._subs = false;
          else if (who == 'all') server.twitch[twitch_channel].permitted = {};
          else server.twitch[twitch_channel].permitted[who] = false;
          
          return input.il8nResponse('twitch.unpermitokay', {who: who});
        }
        else {
          return input.il8nResponse('twitch.usage');
        }
    }

    // note this is permitted for twitch, not talkbot
    isPermitted(server, channel, userstate) {

      if (!server.twitch[channel]) return false;
      if (!server.twitch[channel].permitted) return false;

      var permitted = false;

      if (server.twitch[channel].permitted._all)
      {
        permitted = true;
      }

      if (server.twitch[channel].permitted._subs)
      {
        if ( userstate.subscriber) permitted = true;
      }

      if (server.twitch[channel].permitted._mods)
      {
        if ( userstate.mod) permitted = true;
      }

      if (server.twitch[channel].permitted[userstate.username])
      {
        permitted = true;
      }

      return permitted;
    }

    openTwitchChatLink(server, twitch_channel) {
      const chatChannel = new Chat.client({
        channels: [twitch_channel],
        reconnect: true,
        secure: true
      });

      chatChannel.addListener('message', (channel, userstate, message, self) => {
        var cleanup_channel = channel.substring(1);
        if (this.isPermitted(server, cleanup_channel, userstate)) server.talk(message);
      });

      chatChannel.connect();

      return chatChannel;
    }

    // nerf all the links if any on unfollow
    onUnfollow({server}) {
        for( var key in server.twitch ) {
          var link = server.twitch[key].link;
          link.disconnect();
          delete server.twitch[key];
        }
    }

}

//registration
exports.register =  (commands) => {
    commands.addAll([
        Twitch.command
    ]);
};
  
exports.unRegister = (commands) => {
    commands.removeAll([
        Twitch.command,
    ]);
};
  
exports.Twitch = Twitch;