/*jshint esversion: 9 */
const Command = require("@models/Command");

class AdminRole extends Command {
  get group() {
    return "control";
  }
  get hidden() {
    return true;
  }

  execute({ input }) {
    if (!input.args.length) return input.il8nResponse("adminrole.usage");
    if (!input.ownerIsDev() && !input.ownerCanManageTheServer())
      return input.il8nResponse("adminrole.notbotowner");

    let roles = input.message.mentions.roles.concat(
      input.getNonSnowflakeRoles()
    );
    if (roles.size == 0) {
      input.il8nResponse("adminrole.none");
      return;
    }

    input.server.adminrole = roles.first().id;

    input.il8nResponse("adminrole.okay");
  }
}

//registration
exports.register = (commands) => {
  commands.addAll([AdminRole.command]);
};

exports.unRegister = (commands) => {
  commands.removeAll([AdminRole.command]);
};

exports.AdminRole = AdminRole;
