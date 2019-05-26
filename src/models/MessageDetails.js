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
    this.content = '';

    if (client_data) {
      Object.assign(this, client_data);
    }
  }

  response(message, params) {
<<<<<<< HEAD
    var chan = this.message.channel;
    chan.startTyping(1);
    chan.send(message)
        .then(chan.stopTyping());
=======
    var _this = this;
    var chan = _this.message.channel;
    if ( message.length > 2000 ) {
      Common.error(new Error("message too long for discord"));
      message = message.substring(0,2000);
    }
    chan.startTyping(1);
    chan.send(message)
        .then(chan.stopTyping());
  }

  getNonSnowflakeRoles(){
    if(!this.args) {
      return [];
    }

    this.args.map((e) => e.toLowerCase());

    let roles = this.server.guild.roles;
    return roles.filter((item) => {
      return item.name && this.args.indexOf(item.name.toLowerCase()) > -1;
    });
>>>>>>> plugable_tts
  }

  getResolvedMessage() {
    var content = this.content;
    return botStuff.resolveMessageSnowFlakes(content);
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
  };

  ownerCanManageTheServer() {
    var rtn = botStuff.canManageTheServer(this.server, this.message.member);
    return rtn;
  }

  il8nResponse(key, params) {
    var _this = this;
    var server = this.server;
    if ( !params ) params = {};
    params.title = params.title || server.getMemberSetting(_this.message.member, 'mytitle');
    var message = server.lang(key, params);

    return this.response(message);
  }

  ownerIsServerOwner() {
    var _this = this;
    var server = this.server;
    return botStuff.isServerOwner(server.server_id, _this.message.member.id);
  };

  boundNick() {
    return this.message.guild.members.find( x => x.id == this.server.bound_to).nick;
  }

<<<<<<< HEAD
  getOwnersVoiceChannel() {
    var server_id = this.server.server_id;
    return botStuff.getUserVoiceChannel(server_id, this.message.member.id);
  };

  getUserIds() {
    return Common.userIDs(this.message);
  };

  getUserAndRoleIds() {
    return Common.userAndRoleIDs(this.message);
  };

  lookForRoleFromWordArgs() {
    var roles = [];
    for (const word of this.args) {
      let role = botStuff.getRole(this.server.server_id, word);
      if(role && role.id) {
        roles.push(role.id);
      }
    }

    return roles;
  };

  // gets all the IDs as names
  getDisplayNamesAsCSV() {
=======
  // gets all the IDs as names
  getDisplayNamesAsCSV() {
    var msg = this;
>>>>>>> plugable_tts
    var names = '';
    this.message.mentions.members.forEach(member => {
      names += member.displayName + ', ';
    });
    names = names.substring(0, names.length-2);
    return names;
  };
}

module.exports = MessageDetails;
