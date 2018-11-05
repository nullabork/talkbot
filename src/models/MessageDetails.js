var botStuff = require('../helpers/bot-stuff');

function MessageDetails(client_data) {

    if (!this instanceof MessageDetails) {
      return new MessageDetails(client_data);
    }
  
    this.channel_id = null;
    this.user_id = null;
    this.bot = null;
    this.world = null;
    this.server = null;
    this.username = null;
    this.args = null;
    this.message = '';
    var self = this;
  
    if (client_data) {
      Object.assign(this, client_data);
    }
  
    this.sendMessage = this.response = function (message) {
      self.bot.simulateTyping(self.channel_id, function () {
        self.bot.sendMessage({
          to: self.channel_id,
          message: message
        });
      });
    }
  
    this.getNick = function (user_id) {
      return botStuff.findThingsName(this.channel_id, user_id);
    };
  
    this.ownerIsMaster = function () {
      return this.server.isMaster(this.user_id);
    }
  
    this.ownerIsDev = function () {
      if (!auth.dev_ids || !auth.dev_ids.length) {
        return false;
      }
      return auth.dev_ids.indexOf(this.user_id) >= 0;
    }
  
    this.ownerIsPermitted = function () {
      return this.server.permitted[this.user_id] != null;
    };
  
    this.messageNick = function () {
      return this.getNick(this.user_id);
    }
  
    this.getMessage = function () {
      return this.message;
    }
  
    this.boundNick = function () {
      return botStuff.findThingsName(this.channel_id, this.server.bound_to);
    }
  
    this.getOwnersVoiceChannel = function () {
      return botStuff.getUserVoiceChannel(this.user_id);
    };
  
    this.getUserIds = function () {
      return common.messageIDs(this.message);
    };
  }

  module.exports = MessageDetails;