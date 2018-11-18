var path = require("path"),
  auth = require('@auth');

// models
var BotCommand = require('@models/BotCommand');

function Commands() {
  var self = this;
  this.commands = {};
  this.listeners = {};
  this.command_char = auth.command_char || '!';


  this.add = function (command, force) {
    key = command.command_name.toLowerCase();

    if (!this.commands[key] || force) {
      this.commands[key] = command;

      if (command.listeners)
        for (var listener in command.listeners)
          this.listeners[listener] = command.listeners[listener];
    }
  };

  this.registerAllCommands = function () {
    //console.log(normalizedPath);
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
    for (var listener in command.listeners)
      delete this.listeners[listener];
  }

  this.get = function (key) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return null;
    }
    return this.commands[key];
  }

  this.getListener = function (key) {
    key = key.toLowerCase();

    if (!this.listeners[key]) {
      return function () { };
    }
    return this.listeners[key];
  }

  this.run = function (key, args) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return function () { };
    }

    return this.commands[key].execute.apply(this, args);
  }

  this.notify = function (args) {
    for (var listener in this.listeners) {
      var func = this.listeners[listener];

      if (typeof func == 'function') {
        return func.apply(this, args);
      }
    }
  };
}

commands = new Commands();
commands.registerAllCommands();

module.exports = commands;//commands;
