/*jshint esversion: 9 */
const path = require('path'),
    auth = require('@auth');

// models
const MessageDetails = require('@models/MessageDetails'),
    Command = require('@models/Command'),
    Common = require('@helpers/common');

function Commands() {
    const self = this;
    this.commands = {};
    this.listeners = {
        token: [],
        message: [],
        validate: [],
        joinVoice: [],
        leaveVoice: [],
        follow: [],
        unfollow: [],
        configureSettings: [],
        userJoinedChannel: [],
    };

    this.command_char = auth.command_char || '!';

    this.add = function (command, force) {
        let key = command.command_name.toLowerCase();
        //if is there and the force argument is false
        if (this.commands[key] && !force) return;
        //add the command to the the map
        this.commands[key] = command;

        //no listeners, then stop/
        if (!command.listeners) return;

        //add the listeners
        for (let type in command.listeners) {
            //check if listener is good
            if (!command.listeners.hasOwnProperty(type) || !command.listeners[type]) continue;

            let sequence = (command.sequence && command.sequence[type]) || 0;

            let func = command.listeners[type];
            this.on(type, func, sequence, command);
        }
    };

    this.addAll = (commands) => {
        for (const command of commands) {
            this.add(command);
        }
    };

    this.registerAllCommands = () => {
        require('fs')
            .readdirSync('./src/commands/modules/')
            .forEach((file) => {
                let filename = path.join('modules/', file);
                let command = require('./' + filename.replace('.js', ''));
                command.register(self);
            });
    };

    this.remove = (command) => {
        key = command.command_name.toLowerCase();
        //var command = this.commands[key]
        delete this.commands[key];

        if (command.command_arg) {
            arg = command.command_arg.toLowerCase();
            delete this.commands[arg];
        }
    };

    this.removeAll = (commands) => {
        for (const command of commands) {
            this.remove(command);
        }
    };

    // for commands that have startup tests
    this.runAllStartupTests = () => {
        for (const test in this.commands) if (this.commands[test].startup) this.commands[test].startup();
    };

    this.get = (key) => {
        key = key.toLowerCase();

        if (!this.commands[key]) {
            return null;
        }
        return this.commands[key];
    };

    this.run = (key, args) => {
        key = key.toLowerCase();

        if (!this.commands[key]) {
            return () => {};
        }

        // eat exceptions so poorly written commands don't take down the bot
        try {
            return this.commands[key].execute.apply(this, args);
        } catch (ex) {
            Common.error(ex);
            return null;
        }
    };

    //add
    this.on = function (type, cb, sequence, command) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push({
            cb,
            sequence: sequence || 0,
            command,
        });
    };

    this.notify = function (type, args) {
        let funcs = this.listeners[type];
        if (!funcs || !funcs.length) {
            return;
        }

        funcs.sort((a, b) => {
            return a.sequence - b.sequence;
        });

        let ret = null;
        //eat exceptions so poorly written commands dont bork
        try {
            for (let i = 0; i < funcs.length; i++) {
                let func = funcs[i].cb;
                let command = funcs[i].command;

                if (typeof func == 'function') {
                    args = {
                        ...args,
                        modified: ret,
                        command,
                    };

                    let resp = func.apply(this, [args]);
                    if (resp !== null) {
                        ret = resp;
                    }
                }
            }
        } catch (ex) {
            Common.error(ex);
        }
        return ret;
    };

    // is this Message a command message?
    this.isCommand = function (message, server) {
        let char = this.getCommandChar(server);
        return (
            message.content.substring(0, char.length) === char ||
            message.content.indexOf(this.command_char + 'help') == 0
        ); // help will always work this way
    };

    this.isHelpCommand = function (message) {
        return message.content.indexOf(this.command_char + 'help') == 0;
    };

    // get the command char from the server or default
    this.getCommandChar = function (server) {
        if (server) return server.command_char || this.command_char || '!';
        else return this.command_char || '!';
    };

    // process a message coming in from the real world
    this.process = function (message, server, world) {
        let parts = [];
        const command_char = this.getCommandChar(server);
        if (!this.isCommand(message, server)) return;

        if (this.isHelpCommand(message)) {
            parts = [command_char + 'help', command_char, 'help'];
        } else {
            parts = message.content.match(
                new RegExp('(' + Common.escapeRegExp(this.getCommandChar(server)) + ')([^ ]+)(.*)', 'i'),
            );
        }

        if (!parts || parts.length < 2) {
            return;
        }

        let cmdChar = parts[1];
        let cmdVerb = parts[2] || null;
        let cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
        let cmdContent = (parts[3] || '').trim();

        if (!cmdVerb || !cmdChar) {
            return;
        }

        let msgDets = new MessageDetails({
            world: world,
            server: server,
            message: message,
            cmdChar: cmdChar,
            cmd: cmdVerb,
            args: cmdArgs,
            content: cmdContent,
        });

        Common.out((server ? server.guild.id : 'DM') + ': ' + msgDets.cmd + ' ' + msgDets.content);

        let command = this.get(msgDets.cmd);
        if (!command) return;

        if (server) server.resetNeglectTimeout();

        //this is for the new way... v3 of writing commands, so we can use argument destructoring
        if (command instanceof Command) {
            command.execute({ input: msgDets });
        } else {
            command.execute.apply(this, [msgDets]);
        }
    };
}

commands = new Commands();
commands.registerAllCommands();
commands.runAllStartupTests();

module.exports = commands; //commands;
