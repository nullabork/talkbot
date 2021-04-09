/*jshint esversion: 9 */

const Command = require("@models/Command"),
  MessageSSML = require("@models/MessageSSML");

class AnnounceMe extends Command {
  get group() {
    return "personalization";
  }
  get hidden() {
    return true;
  }

  execute({ input }) {
    const server = input.server;
    const member = input.message.member;
    const currentMode = server.getMemberSetting(member, "announceme") || "off";

    if (!input.args.length)
      return input.il8nResponse("announceme.usage", { setting: currentMode });

    var mode = input.args[0];
    if (/^(on)$/i.test(mode)) {
      mode = "on";
    } else if (/^(off)$/i.test(mode)) {
      mode = "off";
    } else {
      return input.il8nResponse("announceme.usage", { setting: currentMode });
    }

    server.addMemberSetting(input.message.member, "announceme", mode);

    if (mode == "on") return input.il8nResponse("announceme.on");
    input.il8nResponse("announceme.off");
  }

  onFollow({ member, server }) {
    var title =
      server.getMemberSetting(member, "mytitle") || server.world.default_title;
    if (server.getMemberSetting(member, "announceme") == "on") {
      var msg = server.lang("announceme.announcejoin", {
        title: title,
        name: member.displayName,
        verb: "arrived",
      });
      var ssml = new MessageSSML(msg, { server: server }).build();
      server.talk(ssml);
    }
  }

  onUnfollow({ member, server }) {
    // this currently doesn't read out because it leaves voice before speaking, we need someway to delay the leave until the speaking has ended
    // await?
    var title =
      server.getMemberSetting(member, "mytitle") || server.world.default_title;
    if (server.getMemberSetting(member, "announceme") == "on") {
      var msg = server.lang("announceme.announceleave", {
        title: title,
        name: member.displayName,
        verb: "departed",
      });
      var ssml = new MessageSSML(msg, { server: server }).build();
      server.talk(ssml);
    }
  }
}

//registration
exports.register = (commands) => {
  commands.addAll([AnnounceMe.command]);
};

exports.unRegister = (commands) => {
  commands.removeAll([AnnounceMe.command]);
};

exports.AnnounceMe = AnnounceMe;
