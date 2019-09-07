/*jshint esversion: 9 */
const Command = require('@models/Command'),
  config = require("@auth"),
  Common = require('@helpers/common'),
  CommentBuilder = require('@models/CommentBuilder'),
  TextToSpeechService = require('@services/TextToSpeechService'),
  Chat = require('tmi.js');

class Twitch extends Command {

    get group () {  return 'control'; }
    get hidden () { return true; }

    execute ({input}) {
        var server = input.server;

        if (!input.args.length) return input.il8nResponse('twitch.usage');

        if (!server.twitch) server.twitch = {};
        if (!server.isBound()) return input.il8nResponse('twitch.notbound');
        if (!input.ownerIsMaster()) return input.il8nResponse('twitch.notmaster');

        var subcommand = input.args[0];

        if (/^(permit)$/i.test(subcommand)) {
          var twitch_channel = input.args[1];
          var who = input.args[2];

          if (!twitch_channel) return input.il8nResponse('twitch.permitchannel', {advertise_streamer: config.advertise_streamer});          
          if (!who ) return input.il8nResponse('twitch.permitwho', {twitch_channel: twitch_channel});
          
          if (!this.isLinked(server, twitch_channel))
            this.openTwitchChatLink(server, twitch_channel);

          if (who == 'mods') server.twitch[twitch_channel].permitted._mods = true;
          else if (who == 'subs') server.twitch[twitch_channel].permitted._subs = true;
          else if (who == 'all') server.twitch[twitch_channel].permitted._all = true;
          else server.twitch[twitch_channel].permitted[who.toLowerCase()] = true;

          return input.il8nResponse('twitch.permitokay', {who: who, twitch_channel: twitch_channel});
        }

        else if (/^(unpermit)$/i.test(subcommand)) {
          var twitch_channel = input.args[1];
          var who = input.args[2];

          if (!twitch_channel) return input.il8nResponse('twitch.unpermitchannel', {advertise_streamer: config.advertise_streamer});          
          if (!who ) return input.il8nResponse('twitch.unpermitwho', {twitch_channel: twitch_channel});

          if (!server.twitch[twitch_channel]) return;
          if (!server.twitch[twitch_channel].permitted) return;

          if (who == 'mods') server.twitch[twitch_channel].permitted._mods = false;
          else if (who == 'subs') server.twitch[twitch_channel].permitted._subs = false;
          else if (who == 'all') server.twitch[twitch_channel].permitted = {};
          else server.twitch[twitch_channel].permitted[who.toLowerCase()] = false;
          
          return input.il8nResponse('twitch.unpermitokay', {who: who, twitch_channel: twitch_channel});
        }
        else {
          return input.il8nResponse('twitch.usage');
        }
    }

    isLinked(server, twitch_channel) {
      if (!server.twitch) return false;
      if (!server.twitch[twitch_channel]) return false;
      if (server.twitch[twitch_channel].link) return true;
      return false;
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

      if (server.twitch[channel].permitted[userstate.username.toLowerCase()])
      {
        permitted = true;
      }

      return permitted;
    }

    closeTwitchChatLink(server, twitch_channel) {
      var link = server.twitch[twitch_channel].link;
      link.disconnect();
      delete server.twitch[twitch_channel];
    }

    // connects to a twitch channel
    openTwitchChatLink(server, twitch_channel) {
      const twitch = this;
      const chatChannel = new Chat.client({
        channels: [twitch_channel],
        reconnect: true,
        secure: true
      });


      chatChannel.addListener('message', (channel, userstate, message, self) => {
        var cleanup_channel = channel.substring(1);
        var voice = twitch.getVoice(userstate);
        if (twitch.isPermitted(server, cleanup_channel, userstate)) {
          if (!twitch.shouldRateLimit(server))
            server.talk(message, voice);
          else 
            Common.out("Dropping: ", message);
        }
      });

      chatChannel.connect();

      server.twitch[twitch_channel] = {link: chatChannel, permitted: {}};
    }

    shouldRateLimit(server) {
      var limit = config.twitch_audioQueue_limit || 10;
      if ( config.servers && config.servers[server.server_id]) limit = config.servers[server.server_id].twitch_audioQueue_limit;
      if ( server.audioQueue && server.audioQueue.length > limit) return true;
      return false;
    }

    // deterministically gets a random voice for a specific user
    getVoice(userstate) {
      var hashcode = Math.abs(Common.hashCode(userstate.username));

      var ks = Object.keys(TextToSpeechService.providers);
      var provider = ks[hashcode % ks.length]; 
      return {name: TextToSpeechService.providers[provider].getRandomVoice(hashcode, null, "en-US"), voice_provider: provider };
    }

    // nerf all the links if any on unfollow
    onUnfollow({server}) {
        for( var key in server.twitch ) {
          this.closeTwitchChatLink(server, key);
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