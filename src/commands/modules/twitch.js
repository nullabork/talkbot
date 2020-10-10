/*jshint esversion: 9 */
const Command = require("@models/Command"),
  config = require("@auth"),
  Common = require("@helpers/common"),
  TextToSpeechService = require("@services/TextToSpeechService"),
  Chat = require("tmi.js");

class Twitch extends Command {
  get group() {
    return "control";
  }
  get hidden() {
    return true;
  }

  execute({ input }) {
    const server = input.server;

    if (!input.args.length) return input.il8nResponse("twitch.usage");

    if (!server.twitch) server.twitch = {};
    if (!server.isBound()) return input.il8nResponse("twitch.notbound");
    if (!input.ownerIsMaster()) return input.il8nResponse("twitch.notmaster");

    let subcommand = input.args[0];
    let twitch_channel = input.args[1];
    let who = input.args[2];

    // !twitch permit [twitch_channel] [who]
    // allow someone in that twitch channel to speak using talkbot
    if (/^(permit)$/i.test(subcommand)) {
      if (!twitch_channel)
        return input.il8nResponse("twitch.permitchannel", {
          advertise_streamer: config.advertise_streamer,
        });
      if (!who)
        return input.il8nResponse("twitch.permitwho", {
          twitch_channel: twitch_channel,
        });

      if (!this.isLinked(server, twitch_channel))
        this.openTwitchChatLink(server, twitch_channel);

      if (who == "mods") server.twitch[twitch_channel].permitted._mods = true;
      else if (who == "subs")
        server.twitch[twitch_channel].permitted._subs = true;
      else if (who == "all")
        server.twitch[twitch_channel].permitted._all = true;
      else server.twitch[twitch_channel].permitted[who.toLowerCase()] = true;

      return input.il8nResponse("twitch.permitokay", {
        who: who,
        twitch_channel: twitch_channel,
      });
    }

    // !twitch unpermit [twitch_channel] [who]
    // stop someone in that twitch channel from using talkbot
    else if (/^(unpermit)$/i.test(subcommand)) {
      if (!twitch_channel)
        return input.il8nResponse("twitch.unpermitchannel", {
          advertise_streamer: config.advertise_streamer,
        });
      if (!who)
        return input.il8nResponse("twitch.unpermitwho", {
          twitch_channel: twitch_channel,
        });

      if (!server.twitch[twitch_channel]) return;
      if (!server.twitch[twitch_channel].permitted) return;

      if (who == "mods") server.twitch[twitch_channel].permitted._mods = false;
      else if (who == "subs")
        server.twitch[twitch_channel].permitted._subs = false;
      else if (who == "all") server.twitch[twitch_channel].permitted = {};
      else server.twitch[twitch_channel].permitted[who.toLowerCase()] = false;

      return input.il8nResponse("twitch.unpermitokay", {
        who: who,
        twitch_channel: twitch_channel,
      });
    }

    // unknown command show usage
    else {
      return input.il8nResponse("twitch.usage");
    }
  }

  // checks if a channel is already linked
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

    let permitted = false;

    if (server.twitch[channel].permitted._all) {
      permitted = true;
    }

    if (server.twitch[channel].permitted._subs) {
      if (userstate.subscriber) permitted = true;
    }

    if (server.twitch[channel].permitted._mods) {
      if (userstate.mod) permitted = true;
    }

    if (server.twitch[channel].permitted[userstate.username.toLowerCase()]) {
      permitted = true;
    }

    return permitted;
  }

  // string out emotes from a message
  removeEmotes(message, emotes) {
    let emoteList = [];

    for (let id in emotes) {
      if (emotes.hasOwnProperty(id) && emotes[id]) {
        let indexes = emotes[id][0].split("-");
        emoteList.push([+indexes[0], +indexes[1] + 1]);
      }
    }

    emoteList = emoteList.sort((a, b) => a[0] - b[0]);

    for (let i = emoteList.length - 1; i >= 0; i--) {
      message =
        message.substr(0, emoteList[i][0]) +
        message.substr(emoteList[i][1], message.length - 1);
    }

    return message;
  }

  // close a twitch channel link
  closeTwitchChatLink(server, twitch_channel) {
    let link = server.twitch[twitch_channel].link;
    link.disconnect();
    delete server.twitch[twitch_channel];
  }

  // connects to a twitch channel
  openTwitchChatLink(server, twitch_channel) {
    const twitch = this;
    const chatChannel = new Chat.client({
      channels: [twitch_channel],
      reconnect: true,
      secure: true,
    });

    chatChannel.addListener("message", (channel, userstate, message) => {
      let cleanup_channel = channel.substring(1);
      let voice = twitch.getVoice(userstate);
      message = twitch.removeEmotes(message, userstate.emotes);
      if (!message) return;
      if (twitch.isPermitted(server, cleanup_channel, userstate)) {
        if (!twitch.shouldRateLimit(server)) server.talk(message, voice);
        else Common.out("Dropping: ", message);
      }
    });

    chatChannel.connect();

    server.twitch[twitch_channel] = { link: chatChannel, permitted: {} };
  }

  // returns true if we should rate limit a twitch stream
  shouldRateLimit(server) {
    let limit = config.twitch_audioQueue_limit || 10;
    if (config.servers && config.servers[server.server_id])
      limit = config.servers[server.server_id].twitch_audioQueue_limit;
    if (server.audioQueue && server.audioQueue.length > limit) return true;
    return false;
  }

  // deterministically gets a random voice for a specific user
  getVoice(userstate) {
    let hashcode = Math.abs(Common.hashCode(userstate.username));

    let ks = Object.keys(TextToSpeechService.providers);
    let provider = ks[hashcode % ks.length];
    return {
      name: TextToSpeechService.providers[provider].getRandomVoice(
        hashcode,
        null,
        "en-US"
      ),
      voice_provider: provider,
    };
  }

  // nerf all the links if any on unfollow
  onUnfollow({ server, command }) {
    for (let key in server.twitch) {
      command.closeTwitchChatLink(server, key);
    }
  }
}

//registration
exports.register = (commands) => {
  commands.addAll([Twitch.command]);
};

exports.unRegister = (commands) => {
  commands.removeAll([Twitch.command]);
};

exports.Twitch = Twitch;
