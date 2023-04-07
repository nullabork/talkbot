/*jshint esversion: 9 */
/*
 *  _____     _ _    ____        _
 * |_   _|_ _| | | _| __ )  ___ | |_
 *   | |/ _` | | |/ /  _ \ / _ \| __|
 *   | | (_| | |   <| |_) | (_) | |_
 *   |_|\__,_|_|_|\_\____/ \___/ \__|
 *
 * A discord text to speech bot
 *
 * http://github.com/nullabork/talkbot
 */
(async () => {
    //npm imports
    require('module-alias/register');

    //helpers
    const commands = require('@commands'),
        figlet = require('figlet'),
        botStuff = require('@helpers/bot-stuff'),
        Common = require('@helpers/common'),
        testing = require('@helpers/runtime-testing');

    //models
    const world = require('@models/World');

    const bot = botStuff.bot;

    // runtime testing
    await testing.TestIfTTSAPIServicesAreConfigured();

    // FANCY SPLASH SCREEN
    figlet('TalkBot', (err, data) => console.log(data));

    // when the server is ready to go
    bot.on('ready', () => {
        Common.out('Logged in as: ' + bot.user.username + ' - (' + bot.user.id + ')');
        Common.error('LOG CHECKPOINT: THE BOT STARTED. THIS IS NOT AN ERROR MESSAGE');
        world.startup();
    });

    // when the bot is added to new servers
    bot.on('guildCreate', (guild) => {
        try {
            //add the relationships
            world.addServer(guild);
        } catch (ex) {
            Common.error(ex);
        }
    });

    // when the bot is removed from servers
    bot.on('guildDelete', (guild) => {
        try {
            world.removeServer(guild);
        } catch (ex) {
            Common.error(ex);
        }
    });

    // when a member is removed unfollow
    bot.on('guildMemberRemove', (member) => {
        try {
            const server = world.servers[member.guild.id];
            if (server.isMaster(member)) {
                server.release();
            }
        } catch (ex) {
            Common.error(ex);
        }
    });

    // handle voice state updates
    bot.on('voiceStateUpdate', (oldState, newState) => {
        try {
            let i = 0;
            const server = world.servers[oldState.guild.id];
            server.channelJoined(newState);
            if (!oldState) return;

            if (!server.isMaster(oldState.guild.members.cache.get(oldState.id))) return;
            // they've changed voice channels
            if (
                oldState.channelId &&
                (!newState.channelId || !newState.guild.channels.cache.get(newState.channelId).joinable)
            ) {
                server.release();
            } else if (oldState.channelId && newState.channelId && oldState.channelId != newState.channelId) {
                server.switchVoiceChannel(newState.guild.channels.cache.get(newState.channelId));
            }
        } catch (ex) {
            Common.error(ex);
        }
    });

    // when messages come in
    bot.on('messageCreate', (message) => {
        try {
            // ignore message from myself
            if (message.member && message.member.id == bot.user.id) return;

            let server = null;

            // if its in a server and not a DM
            if (message.guild) {
                server = world.servers[message.guild.id];

                if (server == null) {
                    Common.error("Can't find server for guild id: " + message.guild.id);
                    return null;
                }
            }

            // is the message a command?
            if (commands.isCommand(message, server)) {
                commands.process(message, server, world);
            } else if (message.member) {
                // say it out loud
                // 
                server.speak(message);
            }
        } catch (ex) {
            Common.error(ex);
        }
    });

    // if we get disconnected???
    bot.on('shardDisconnect', (evt, shardID) => {
        try {
            world.saveAll();
            world.dispose();
            Common.out(`Shard ${shardID} Disconnected, reconnecting`);
            Common.out(evt);
            botStuff.connect();
        } catch (ex) {
            Common.error(ex);
        }
    });

    // capture a whole pile of useful information
    bot.on('error', Common.error);
    bot.on('guildUnavailable', (guild) => Common.error('guild unavailable: ' + guild.id));
    bot.on('rateLimit', (info) => {
        Common.error('rate limited');
        Common.error(info);
    });
    bot.on('shardResume', (replayed, shardID) => Common.error(`resume ${shardID}: ` + replayed));
    bot.on('warn', (info) => Common.error('warn:' + info));

    bot.on('shardReconnecting', (id) => Common.error(`Shard with ID ${id} reconnected.`));

    // ctrl-c
    process.on('SIGINT', () => world.kill('SIGINT'));

    // something goes wrong we didnt think of or having got around to putting a band-aid fix on
    process.on('uncaughtException', (err) => {
        Common.error(err);
        world.kill('uncaughtException: ' + err.message);
    });

    // start it up!
    botStuff.connect();
})(); // wtf async.
