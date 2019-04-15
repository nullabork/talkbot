var botStuff = require("@helpers/bot-stuff"),
  Common = require("@helpers/common"),
  auth = require("@auth");

class MessageDetails {

  constructor(client_data) {
    this.channel_id = null;
    this.user_id = null;
    this.bot = null;
    this.world = null;
    this.server = null;
    this.username = null;
    this.args = null;
    this.message = '';

    if (client_data) {
      Object.assign(this, client_data);
    }
  }

  response(message, params) {
    var _this = this;
    
    _this.bot.simulateTyping(_this.channel_id, function () {
      _this.bot.sendMessage({
        to: _this.channel_id,
        message: message
      });
    });
  }

  getResolvedMessage() {
    var message = this.message;
    return botStuff.resolveMessageSnowFlakes(message);
  }

  getNick(user_id) {
    return botStuff.findThingsName(this.channel_id, user_id);
  };

  ownerIsMaster() {
    return this.server.isMaster(this.user_id);
  }

  ownerCanManageTheServer() {
    return this.server.canManageTheServer(this.user_id);
  }

  ownerIsDev() {
    if (!auth.dev_ids || !auth.dev_ids.length) {
      return false;
    }
    return auth.dev_ids.indexOf(this.user_id) >= 0;
  }

  ownerIsPermitted() {
    return this.server.permitted[this.user_id] != null;
  };

  il8nResponse(key, params) {
    var _this = this;
    var server = this.server;
    if ( !params ) params = {};
    params.title = params.title || server.getUserSetting(_this.user_id, 'mytitle');
    var message = server.lang(key, params);
    
    return this.response(message);
  }

  ownerIsServerOwner() {
    return this.server.server_owner_user_id == this.user_id;
  };

  messageNick() {
    return this.getNick(this.user_id);
  }

  getMessage() {
    return this.message;
  }

  boundNick() {
    return botStuff.findThingsName(this.channel_id, this.server.bound_to);
  }

  getOwnersVoiceChannel() {
    return botStuff.getUserVoiceChannel(this.user_id);
  };

  getUserIds() {
    return Common.userIDs(this.message);
  };
  
  getUserAndRoleIds() {
    return Common.userAndRoleIDs(this.message);
  };
  
  // gets all the IDs as names
  getUserNicksAsCSV() {
    
    var msg = this;
    var target_ids = msg.getUserAndRoleIds();
    var names = '';
    target_ids.forEach(function (target_id) {
      var name = botStuff.findThingsName(msg.channel_id, target_id);
      if ( name )
        names += name + ', ';
      else
        names += target_id + ', ';
    });
    names = names.substring(0, names.length-2);
    
    return names;
  };


}

module.exports = MessageDetails;
