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
    key = command.command_name.toLowerCase();

    if (!this.commands[key] || force) {
      this.commands[key] = command;

      if (command.listeners) {
        for (var type in command.listeners) {
          if (command.listeners.hasOwnProperty(type)) {
            var func = command.listeners[type];
            if (!this.listeners[type]) {
              this.listeners[type] = [];
            }
            this.listeners[type].push(func);
          }
        }

        // for (var listener in command.listeners)
        //   this.listeners[listener] = command.listeners[listener];
      }
    }
  };

  this.registerAllCommands = function () {
    //Common.out(normalizedPath);
    require("fs").readdirSync("./src/commands/modules/").forEach(function (file) {
      var filename = path.join("modules/", file);
      var command = require("./" + filename.replace('.js', ''));
      command.register(self);
    });
  }

  this.remove = function (command) {
    key = command.command_name.toLowerCase();
    var command = this.commands[key]
    delete this.commands[key];
    // for (var listener in command.listeners)
    //   delete this.listeners[listener];
  }

  this.get = function (key) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return null;
    }
    return this.commands[key];
  }

  // this.getListener = function (key) {
  //   key = key.toLowerCase();

  //   if (!this.listeners[key]) {
  //     return function () { };
  //   }
  //   return this.listeners[key];
  // }

  this.run = function (key, args) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return function () { };
    }

    return this.commands[key].execute.apply(this, args);
  }

  this.notify = function (type, args) {

    var funcs = this.listeners[type];
    if (!funcs || !funcs.length) {
      return;
    }

    var ret = null;
    for (let i = 0; i < funcs.length; i++) {
      var func = funcs[i];

      if (typeof func == 'function') {
        var resp = func.apply(this, args);
        if (resp) {
          ret = resp;
        }
      }
    }
    return ret;
  };
}

commands = new Commands();
commands.registerAllCommands();

module.exports = commands;//commands;
