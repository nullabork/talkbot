var path = require("path");

function Commands() {
  var self = this;
  this.commands = {};

  this.add = function (key, command, force) {
    if (!this.commands[key] || force)
      this.commands[key] = command;
  }

  this.registerAllCommands = function () {
    //console.log(normalizedPath);
    require("fs").readdirSync("./modules/commands/modules/").forEach(function (file) {
      var filename = path.join("modules/", file);
      var command = require("./" + filename.replace('.js', ''));
      command.register(self);
    });
  }

  this.remove = function (key) {
    delete this.commands[key];
  }

  this.get = function (key) {
    if (!this.commands[key]) {
      return function () { };
    }
    return this.commands[key];
  }
}

commands = new Commands();
commands.registerAllCommands();

exports.default = commands;//commands;
