/*jshint esversion: 9 */
var Command = require('@models/Command')
  CommentBuilder = require('@models/CommentBuilder'),
  auth = require('@auth'),
  Common = require('@helpers/common');

class Broadcast extends Command {

  constructor() {
    super();
    this.broadcastMessage = "";
  }

  setConfirmation({ broadcastMessage }) {
    this.broadcastMessage = broadcastMessage;
    setTimeout(() => {
      this.broadcastMessage = "";
    }, 40000);
  }

  static speakMessageToServer({server, broadcastMessage}) {
    if(server && server.bound_to){
      let beeps = Common.alertBeepsSSML();
      server.talk( "<speak> " + beeps + broadcastMessage + " </speak>", null, null);
    }
  }

  static broadcast({world, broadcastMessage}) {
    for (var id in world.servers) {
      if(world.servers[id] && world.servers[id].bound_to ) {
        Broadcast.speakMessageToServer({
          server : world.servers[id],
          broadcastMessage : broadcastMessage
        });
      }
    }
  }

  execute ({input}) {

    let server = input.server;
    let world = input.world;

    if (!input.ownerIsDev()) return;
    let message = input.content;

    if(
      input.args &&
      input.args.length == 1 &&
      input.args[0].length &&
      /(confirm|yes|y)/gi.test(input.args[0]) &&
      this.broadcastMessage &&
      this.broadcastMessage.length > 15)
    {

      Broadcast.broadcast({
        world,
        broadcastMessage : this.broadcastMessage
      });

      input.il8nResponse("general.okay");
    }
    else
    {
      input.il8nResponse("broadcast.confirmation");
      this.setConfirmation({ broadcastMessage :  message });
      server.talk("<speak> This will be the message broadcast <break time='700ms'/> </speak>");

      Broadcast.speakMessageToServer({
        server,
        broadcastMessage : this.broadcastMessage + " <break time='700ms'/>. Are you sure?"
      });

    }
  }
}

//registration
exports.register = (commands) => {
  commands.add(Broadcast.command)
};

exports.unRegister = (commands) => {
  commands.remove(Broadcast.command)
};

exports.Broadcast = Broadcast;
