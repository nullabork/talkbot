

//npm imports
require('module-alias/register');
var path = require('path'),
  paths = require('@paths');
//helpers
var commands = require('@commands'),
  botStuff = require('@helpers/bot-stuff');
  Common = require('@helpers/common'),
  testing = require('@helpers/runtime-testing');

//models
var world = require('@models/World'),
  Server = require('@models/Server'),
  MessageSSML = require('@models/MessageSSML'),
  MessageDetails = require('@models/MessageDetails');

// runtime testing
testing.TestIfChildProcessIsWorkingHowDiscordIONeedsItTo();


// Creates a client


var bot = botStuff.bot;

// var ssml = new SSML({});

// var bot = new Discord.Client({
//   token: auth.token,
//   autorun: true
// });

bot.on('ready', function (evt) {
  Common.out('Logged in as: ' + bot.username + ' - (' + bot.id + ')');

  // cool status
  bot.setPresence({
    status: 'online',
    game: {
      name: "",
      type: 1,
      url: ''
    }
  });

  // init all other servers
  world.initServers();
  // load the state
  world.load();

});

bot.on('disconnect', function (evt) {
  Common.out('Disconnected');
  bot.connect();
});

bot.on('any', function (evt) {

  if (evt.t == 'GUILD_CREATE') {
    var server_id = evt.d.id;



    // when added to a server do this - need to wait a bit for the library to init
    var add_server = function () {
      world.addServer(new Server(bot.servers[server_id], server_id,  world.servers[server_id]));
    };

    setTimeout(add_server, 10000);
  }
  else if (evt.t == 'VOICE_STATE_UPDATE') {
    // if my master's voice status changes
    var channel_id = null;
    if (evt.d)
      var channel_id = evt.d.channel_id;
    var server = world.getServerFromChannel(channel_id);
    if (server == null) {
      Common.out("What server?: " + channel_id);
      world.checkMastersVoiceChannels(evt.d.user_id);
      return null;
    }

    //was this eventer the current
    if (evt.d && server.isMaster(evt.d.user_id)) {

      if (!channel_id) {
        if (server.inChannel()) {
          server.leaveVoiceChannel();
        }
      } else if (!botStuff.isVoiceChannel(channel_id)) {
        Common.out('Not a voice channel');
      } else {
        server.joinVoiceChannel(channel_id);
      }
    }
  }
});

bot.on('message', function (username, user_id, channel_id, message, evt) {

  if (Common.isMessageExcluded(message)) return null;

  var server = world.getServerFromChannel(channel_id);

  if (server == null) {
    Common.error("Can't find server for " + channel_id);
    return null;
  }

  // is the message a command?
  if (message.substring(0, commands.command_char.length) == commands.command_char) {

    server.resetNeglectTimeout();

    var parts = message.match(
      new RegExp("(" + Common.escapeRegExp(commands.command_char) + ")([^ ]+)(.*)", "i")
    );

    if (!parts || parts.length < 2) {
      return;
    }

    var cmdChar = parts[1];
    var cmdVerb = parts[2] || null;
    var cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
    var cmdMessage = (parts[3] || "").trim()

    if (!cmdVerb || !cmdChar) {
      return;
    }

    var msgDets = new MessageDetails({
      channel_id: channel_id,
      user_id: user_id,
      bot: botStuff.bot,
      world: world,
      server: server,
      username: username,
      cmdChar: cmdChar,
      cmd: cmdVerb,
      args: cmdArgs,
      message: cmdMessage,
    });

    commands.run(msgDets.cmd, [msgDets, server, world]);

  } else {
    if (message == null) return;

    // tts bit


    // if (!) {
    //   botStuff.translate_client
    //     .translate(text, target)
    //     .then( results => {
    //       var translation = results[0];
    //     })
    //     .catch(err => {
    //       console.error('ERROR:', err);
    //     });

    // }
    // message = ssml.build(message);

    if (message.length < 1) return;
    var ret = commands.notify('message', [message, user_id, server, world]);
    if (ret) message = ret;

    if (!server.inChannel()) return;
    if (!server.isPermitted(user_id)) return;



    message = botStuff.resolveMessageSnowFlakes(channel_id, message);
    message = Common.cleanMessage(message);


    function speak(msg) {
      var message = new MessageSSML(msg, { server: server }).build();
      var settings = server.getUserSettings(user_id);
      server.talk(message, settings);
    }

    var tolang = server.getUserSetting(user_id, 'toLanguage');
    if (tolang && !tolang == "default") {

      botStuff.translate_client
        .translate(message, tolang)
        .then( results => {
          speak(results[0]);
        })
        .catch(err => {
          Common.error( err );
        });
    } else {
      speak(message);
    }
  }
});


process.on('SIGINT', function () {
  world.save();
  bot.disconnect();
  process.exit();
});

process.on('uncaughtException', function (err) {
  Common.error(err);
  bot.disconnect();
  process.exit();
});
