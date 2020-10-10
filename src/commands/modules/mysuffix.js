/*jshint esversion: 9 */

var Command = require("@models/Command");

class MySuffix extends Command {
  get group() {
    return "personalization";
  }
  get hidden() {
    return true;
  }

  execute({ input }) {
    const server = input.server;
    const member = input.message.member;
    let mysuffix = server.getMemberSetting(member, "mysuffix") || {
      suffix: member.displayName,
      enabled: false,
    };

    if (!input.args.length)
      return input.il8nResponse("mysuffix.usage", { setting: mysuffix.suffix });

    let mode = input.args[0];
    if (/^(on)$/i.test(mode)) {
      mysuffix.enabled = true;
      server.addMemberSetting(input.message.member, "mysuffix", mysuffix);
      return input.il8nResponse("mysuffix.on", { setting: mysuffix.suffix });
    } else if (/^(off)$/i.test(mode)) {
      mysuffix.enabled = false;
      server.addMemberSetting(input.message.member, "mysuffix", mysuffix);
      return input.il8nResponse("mysuffix.off");
    } else if (/^(set)$/i.test(mode)) {
      let a = input.args;
      a.shift();
      mysuffix.suffix = a.join(" ");
      server.addMemberSetting(input.message.member, "mysuffix", mysuffix);
      input.il8nResponse("mysuffix.setokay", { setting: mysuffix.suffix });
    } else {
      return input.il8nResponse("mysuffix.usage", { setting: mysuffix.suffix });
    }
  }

  onMessage({ message, content, modified, server }) {
    const member = message.member;

    const mysuffix = server.getMemberSetting(member, "mysuffix");
    if (mysuffix && mysuffix.enabled) {
      const suffix = mysuffix.suffix || member.displayName;
      return (modified || content) + " " + suffix;
    }
    return null;
  }
}

//registration
exports.register = (commands) => {
  commands.addAll([MySuffix.command]);
};

exports.unRegister = (commands) => {
  commands.removeAll([MySuffix.command]);
};

exports.MySuffix = MySuffix;
