var path = require("path");

function Commands() {
  var self = this;
  this.commands = {};

  this.add = function (key, command, force) {
    key = key.toLowerCase();
    
    if (!this.commands[key] || force)
      this.commands[key] = command;
  }

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

  this.get = function (key) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return function () { };
    }
    return this.commands[key];
  }

  this.run = function (key, args) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return function () { };
    }
    var func = this.commands[key];

    if(typeof func == 'function') {
      return func.apply(this, args);
    }
  }
}

commands = new Commands();
commands.registerAllCommands();

module.exports = commands;//commands;
