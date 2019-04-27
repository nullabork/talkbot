/*jshint esversion: 9 */
var path = require("path"),
  auth = require('@auth');

// models
var BotCommand = require('@models/BotCommand'),
  MessageDetails = require('@models/MessageDetails'),
  Command = require('@models/Command'),
  Common = require('@helpers/common');


function Commands() {
  var self = this;
  this.commands = {};
  this.listeners = {
    token: [],
    message: [],
    validate: [],
    joinVoice: [],
    leaveVoice: [],
    follow: [],
    unfollow: [],
    configureSettings: []
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

    //add the listeners
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
  };

  this.registerAllCommands = function () {
    require("fs").readdirSync("./src/commands/modules/").forEach(function (file) {
      var filename = path.join("modules/", file);
      var command = require("./" + filename.replace('.js', ''));
      command.register(self);
    });
  };



  this.remove = function (command) {
    key = command.command_name.toLowerCase();
    //var command = this.commands[key]
    delete this.commands[key];


    if (command.command_arg) {
      arg = command.command_arg.toLowerCase();
      delete this.commands[arg];
    }
  };

  this.removeAll = function (commands) {
    for (const command of commands) {
      this.remove(command);
    }
  };

  // for commands that have startup tests
  this.runAllStartupTests = function() {
    for (var test in this.commands)
      if (this.commands[test].startup)
        this.commands[test].startup();
  };

  this.get = function (key) {
    key = key.toLowerCase();

    if (!this.commands[key]) {
      return null;
    }
    return this.commands[key];
  };

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
  };

    //add
  this.on = function (type, cb, sequence) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push({
      cb,
      sequence : sequence || 0
    });
  };

  this.notify = function (type, args) {

    var funcs = this.listeners[type];
    if (!funcs || !funcs.length) {
      return;
    }

    funcs.sort((a, b) => {
      return a.sequence - b.sequence;
    });

    var ret = null;
    //eat exceptions so poorly written commands dont bork
    try {
      for (let i = 0; i < funcs.length; i++) {
        var func = funcs[i].cb;

        if (typeof func == 'function') {
          args = {
            ...args,
            modified : ret
          };

          var resp = func.apply(this, [args]);
          if (resp !== null) {
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
  
  // is this Message a command message?
  this.isCommand = function(message) {
    return (message.content.substring(0, this.command_char.length) == this.command_char);
  };
  
  // process a message coming in from the real world
  this.process = function(message, server, world) {
    
    if ( !this.isCommand(message)) return;
    
    var parts = message.content.match(
      new RegExp("(" + Common.escapeRegExp(this.command_char) + ")([^ ]+)(.*)", "i")
    );
    
    if (!parts || parts.length < 2) {
      return;
    }

    var cmdChar = parts[1];
    var cmdVerb = parts[2] || null;
    var cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
    var cmdContent = (parts[3] || "").trim();

    if (!cmdVerb || !cmdChar) {
      return;
    }

    var msgDets = new MessageDetails({
      world: world,
      server: server,
      message: message,
      cmdChar: cmdChar,
      cmd: cmdVerb,
      args: cmdArgs,
      content: cmdContent
    });

    Common.out((server? server.guild.id : 'DM') + ': ' + msgDets.cmd + ' ' + msgDets.content);

    var command = this.get(msgDets.cmd);
    if(!command) return;

    if ( server ) server.resetNeglectTimeout();

    //this is for the new way... v3 of writing commands, so we can use argument destructoring
    if (command instanceof Command) {
      command.execute({input : msgDets});
    } else {
      command.execute.apply(this, [msgDets]);
    }
  };
}

commands = new Commands();
commands.registerAllCommands();
commands.runAllStartupTests();

module.exports = commands;//commands;
