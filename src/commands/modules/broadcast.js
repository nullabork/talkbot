/**
 * Command: stats
 * shows some stuff
 */


var Command = require('@models/Command')
  CommentBuilder = require('@models/CommentBuilder'),
  auth = require('@auth'),
  Common = require('@helpers/common');

class Broadcast extends Command {

  constructor() {
    super();
    this.broadcastMessage = "";
  }

  confirmNeeded({ broadcastMessage }) {
    this.broadcastMessage = broadcastMessage;
    setTimeout(() => {
      this.broadcastMessage = "";
    }, 15000);
  }

  static broadcast({message}) {
    for (var id in world.servers) {
      if(world.servers[id] && world.servers[id].bound_to ) {
        world.servers[id].talk(Common.alertBeepsSSML() + message, null, null);
      }
    }
  }

  execute ({input, server, world}) {
    if (!msg.ownerIsDev()) return;

    let message = input.getMessage();

    if(/^confirm|yes|y$/gi.test(message)
      && this.broadcastMessage
      && this.broadcastMessage.length > 20)
    {
      BroadCast.broadcast();
      input.il8nResponse("general.okay");
    }
    else if(!this.broadcastMessage)
    {

      input.il8nResponse("broadcast.confirmation");
      setConfirmation({ broadcastMessage :  message });
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

exports.Stats = Stats;
