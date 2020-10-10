/*jshint esversion: 9 */
var botStuff = require("@helpers/bot-stuff"),
  Common = require("@helpers/common"),
  auth = require("@auth");

class MessageDetails {
  constructor(client_data) {
    this.world = null;
    this.server = null;
    this.args = null;
    this.message = null;
    this.content = "";

    if (client_data) {
      Object.assign(this, client_data);
    }
  }

  response(message, params) {
    var _this = this;
    var chan = _this.message.channel;
    if (message.length > 2000) {
      Common.error(new Error("message too long for discord"));
      message = message.substring(0, 2000);
    }
    chan.startTyping(1);
    chan.send(message).then(chan.stopTyping());
  }

  richResponse(embobj) {
    var _this = this;
    var chan = _this.message.channel;
    chan.startTyping(1);
    chan.send({ embed: embobj }).then(chan.stopTyping());
  }

  getNonSnowflakeRoles() {
    if (!this.args) {
      return [];
    }

    this.args.map((e) => e.toLowerCase());

    let roles = this.server.guild.roles;
    return roles.filter((item) => {
      return item.name && this.args.indexOf(item.name.toLowerCase()) > -1;
    });
  }

  ownerIsMaster() {
    return this.server.isMaster(this.message.member);
  }

  ownerIsDev() {
    if (!auth.dev_ids || !auth.dev_ids.length) {
      return false;
    }
    return auth.dev_ids.indexOf(this.message.member.id) >= 0;
  }

  ownerIsPermitted() {
    return this.server.isPermitted(this.message.member);
  }

  ownerCanManageTheServer() {
    var rtn = botStuff.canManageTheServer(this.server, this.message.member);
    return rtn;
  }

  memberCanManageTheBot() {
    var rtn = botStuff.canManageTheBot(this.server, this.message.member);
    return rtn;
  }

  il8nResponse(key, params) {
    var _this = this;
    var server = this.server;
    if (!params) params = {};
    params.title =
      params.title || server.getMemberSetting(_this.message.member, "mytitle");
    var message = server.lang(key, params);

    return this.response(message);
  }

  // gets all the IDs as names
  getDisplayNamesAsCSV() {
    var msg = this;
    var names = "";
    msg.message.mentions.members.forEach((member) => {
      names += member.displayName + ", ";
    });
    names = names.substring(0, names.length - 2);

    return names;
  }
}

module.exports = MessageDetails;
