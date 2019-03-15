var path = require("path"),
  auth = require('@auth');

// models
var BotCommand = require('@models/BotCommand');

function Commands() {
  var self = this;
  this.commands = {};
  this.listeners = {
    token: [],
    message: []
  };

  this.command_char = auth.command_char || '!';



  this.add = function (command, force) {
    var key = command.command_name.toLowerCase();
    //if is there and the force argument is false
    if (this.commands[key] && !force) return;
    //add the command to the the map
    this.commands[key] = command;




    //no listeners, then stop/
    if (!command.listeners) return;

    //add the listerners
    for (var type in command.listeners) {
      //check if listener is good
      if (!command.listeners.hasOwnProperty(type) || !command.listeners[type]) continue;

      var sequence = command.sequence && command.sequence[type] || 0;

      var func = command.listeners[type];
      this.on(type, func, sequence);
    }
  };

  this.addAll = function(commands){
    for (const command of commands) {
      this.add(command);
    }
  }

  this.registerAllCommands = function () {
    require("fs").readdirSync("./src/commands/modules/").forEach(function (file) {
      var filename = path.join("modules/", file);
      var command = require("./" + filename.replace('.js', ''));
      command.register(self);
    });
  }



  this.remove = function (command) {
    key = command.command_name.toLowerCase();
    //var command = this.commands[key]
    delete this.commands[key];


    if (command.command_arg) {
      arg = command.command_arg.toLowerCase();
      delete this.commands[arg];
    }
  }

  this.removeAll = function (commands) {
    for (const command of commands) {
      this.remove(command);
    }
  }

  // for commands that have startup tests
  this.runAllStartupTests = function() {
    for (var test in this.commands)
      if (this.commands[test].startup)
        this.commands[test].startup();
  }

  this.get = function (key) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return null;
    }
    return this.commands[key];
  }

  this.run = function (key, args) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return function () { };
    }

    // eat exceptions so poorly written commands don't take down the bot
    try {
      return this.commands[key].execute.apply(this, args);
    }
    catch(ex)
    {
      Common.error(ex);
      return null;
    }
  }

    //add
  this.on = function (type, cb, sequence) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push({
      cb,
      sequence : sequence || 0
    });
  }

  this.notify = function (type, args) {

    var funcs = this.listeners[type];
    if (!funcs || !funcs.length) {
      return;
    }

    funcs.sort((a, b) => {
      return a.sequence - b.sequence;
    })

    var ret = null;
    //eat exceptions so poorly written commands dont bork
    try {
      for (let i = 0; i < funcs.length; i++) {
        var func = funcs[i].cb;


        if (typeof func == 'function') {
          args = {
            ...args,
            modified : ret
          }

          var resp = func.apply(this, [args]);

          if (resp) {
            ret = resp;
          }
        }
      }
    }
    catch(ex)
    {
      Common.error(ex);
    }
    return ret;
  };
}

commands = new Commands();
commands.registerAllCommands();
commands.runAllStartupTests();

module.exports = commands;//commands;
