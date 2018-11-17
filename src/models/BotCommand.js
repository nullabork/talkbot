// class for all the details of a command

class BotCommand {
  
  constructor(client_data) {
    this.command_name = null;
    this.execute = function() {}; // stub bogus function to prevent bogusness
    this.short_help = null;
    this.long_help = null;
    this.hidden = false;
    this.listeners = {};

    if (client_data) {
      Object.assign(this, client_data);
    }
  }
};

module.exports = BotCommand;
