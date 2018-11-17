var path = require("path"),
  auth = require('@auth');

function Commands() {
  var self = this;
  this.commands = {};
  this.listeners = {};
  this.command_char = auth.command_char || '!';
  
  this.add = function (key, command, force) {
    key = key.toLowerCase();

    if (!this.commands[key] || force)
      this.commands[key] = command;
  };
  
  this.addListener = function(key, callback) {
    key = key.toLowerCase();
    
    if (!this.listeners[key] || force)
      this.listeners[key] = callback;
  };

  this.registerAllCommands = function () {
    //console.log(normalizedPath);
    require("fs").readdirSync("./src/commands/modules/").forEach(function (file) {
      var filename = path.join("modules/", file);
      var command = require("./" + filename.replace('.js', ''));
      command.register(self);
    });
  }

  this.remove = function (key) {
    key = key.toLowerCase();
    delete this.commands[key];
  }

  this.removeListener = function(key) {
    key = key.toLowerCase();
    delete this.listeners[key];
  };
  
  this.get = function (key) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return function () { };
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
    var func = this.commands[key];

    if (typeof func == 'function') {
      return func.apply(this, args);
    }
  }
  
  this.notify = function(args) {
    for ( var listener in this.listeners)
    {
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
