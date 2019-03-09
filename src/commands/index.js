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

    if (!this.commands[key] || force) {
      this.commands[key] = command;

      if (command.listeners) {
        for (var type in command.listeners) {
          if (command.listeners.hasOwnProperty(type)) {
            var func = command.listeners[type];
            this.on(type, func);
          }
        }
      }
    }
  };

  this.on = function (type, cb) {

      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(cb);

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


    // for (var listener in command.listeners)
    //   delete this.listeners[listener];
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

  this.notify = function (type, args) {

    var funcs = this.listeners[type];
    if (!funcs || !funcs.length) {
      return;
    }

    var ret = null;
    //eat exceptions so poorly written commands dont bork
    try {
      for (let i = 0; i < funcs.length; i++) {
        var func = funcs[i];

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
