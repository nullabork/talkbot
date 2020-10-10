/*jshint esversion: 9 */

var Command = require("@models/Command");

class MyPrefix extends Command {
  get group() {
    return "personalization";
  }
  get hidden() {
    return true;
  }

  execute({ input }) {
    const server = input.server;
    const member = input.message.member;
    let myprefix = server.getMemberSetting(member, "myprefix") || {
      prefix: member.displayName,
      enabled: false,
    };

    if (!input.args.length)
      return input.il8nResponse("myprefix.usage", { setting: myprefix.prefix });

    let mode = input.args[0];
    if (/^(on)$/i.test(mode)) {
      myprefix.enabled = true;
      server.addMemberSetting(input.message.member, "myprefix", myprefix);
      return input.il8nResponse("myprefix.on", { setting: myprefix.prefix });
    } else if (/^(off)$/i.test(mode)) {
      myprefix.enabled = false;
      server.addMemberSetting(input.message.member, "myprefix", myprefix);
      return input.il8nResponse("myprefix.off");
    } else if (/^(set)$/i.test(mode)) {
      let a = input.args;
      a.shift();
      myprefix.prefix = a.join(" ");
      server.addMemberSetting(input.message.member, "myprefix", myprefix);
      input.il8nResponse("myprefix.setokay", { setting: myprefix.prefix });
    } else {
      return input.il8nResponse("myprefix.usage", { setting: myprefix.prefix });
    }
  }

  onMessage({ message, content, modified, server }) {
    const member = message.member;

    let myprefix = server.getMemberSetting(member, "myprefix");
    if (myprefix && myprefix.enabled) {
      let prefix = myprefix.prefix || member.displayName;
      return prefix + " " + (modified || content);
    }
    return null;
  }
}

//registration
exports.register = (commands) => {
  commands.addAll([MyPrefix.command]);
};

exports.unRegister = (commands) => {
  commands.removeAll([MyPrefix.command]);
};

exports.MyPrefix = MyPrefix;
