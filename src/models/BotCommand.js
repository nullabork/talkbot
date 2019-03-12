// class for all the details of a command

class BotCommand {

  constructor(client_data) {
    this.command_name = null;
    this.command_arg = null;
    this.startup = null;
    //this.execute = function () { }; // stub bogus function to prevent bogusness
    this.short_help = null;
    this.long_help = null;
    this.hidden = false;
    this.listeners = {};
    this.order = 99;


    this.sequence = {
      message : 0,
      token : 0
    };

    if (client_data) {
      Object.assign(this, client_data);
    }
  }
  // stub bogus function to prevent bogusness
  execute () {

  }
};

module.exports = BotCommand;
