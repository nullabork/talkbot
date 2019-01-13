var config = require("@auth");

class Common {
  //clean string so its usable in RegExp
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  //does string token contain the parts required to be an emoji
  static isEmoji(str) {
    if (str.length < 3) return false;
    return (str[0] == ':' && str[str.length - 1] == ':');
  };

  // woot is a monster
  static isURL(url) {
    // fax, i'm probably a monster
    if (url.length < 4) return false;
    if (url.substring(0, 4) == "http") return true;
    return false;
  }

  //fetches all forms of message Ids from a string and returns an array
  static messageIDs(message) {
    var user_ids = message.match(/<@!{0,1}(\d{12,19})>/g);

    if (!user_ids) return [];

    var map = user_ids.map(function (element) {
      var ids = element.replace(/<[@#]{0,1}[!&]{0,1}(\d{12,19})>/g, function (a, b) {
        return b;
      });

      return ids;
    });

    return map;
  }

  //console.log() if its turned on
  static out(message) {

    if (typeof message == 'object' && message.stack) {
      message = message.stack;
    }

    if (config.logging && config.logging.out) {
      console.log(
        "\n" +
        new Date() + "\n" +
        message
      );
    }
  }

  //Common.error() is its turned out
  static error(message) {

    if (typeof message == 'object' && message.stack) {
      message = message.stack;
    }

    if (config.logging && config.logging.err) {
      console.error(
        "\n" +
        new Date() + "\n" +
        message
      );
    }
  }

  //dont know.
  static isMessageExcluded(message) {
    return message.startsWith('```');
  }

  //clamp a number between two range
  static numberClamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  //map input number from one range to another range
  static scaleToRange(num, in_min, in_max, out_min, out_max) {
    var number = Common.numberClamp(num, in_min, in_max);
    return (number - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }

  //make cased names become human readable
  static caseToSpace(nick_name) {
    return nick_name.replace(/([a-z])([A-Z])/g, function (a, b, c) {
      return b + " " + c;
    });
  };

  //replacer than finds and replaces things that look like ids with what the callback returns.
  static replaceSnowFlakes(message, fn) {
    return message.replace(/<[@#]{0,1}[!&]{0,1}(\d{12,19})>/g, function (match, entity_id) {
      return fn(entity_id);
    });
  };


  //const element = string[char];
  //   if(element != "-"){
  //     continue;
  //   }

  //   var index = 0;
  //   var p = Common.peek(string, char, function(v, c, i){
  //     if(c == " " || c == "-") {
  //       return false;
  //     }

  //     if(/[a-z]/i.test(c)) {
  //       return true;
  //     }
  //   });

  //   if(p){

  //   }


  // }

  static arg() {
    return {
      name: '',
      value: ''
    }
  };

  static parseArguments(string) {
    string = string.replace(/\W+/g, ' ');

    var args = [

    ];

    var command = Common.arg();

    for (let i = 0; i < string.length; i++) {
      var e = string[i],
        peek = i == string.length - 1 ? null : string[i + 1];

      if (e == '-' && command.name) {
        args.push(command);
        command = Common.arg();
      }

      if (/[ =]/i.test(e) && peek == '-') {
        args.push(command);
        command = Common.arg();
      } else if (e == '-' && /[a-z]/i.test(peek)) {
        command.name = peek;
        ++i;
      } else if (/[a-z]/i.test(e) && command.name && !command.value) {
        command.name += e;
      } else if ((/[ =]/i.test(e) && command.name && !command.value)) {
        command.value += peek;
        ++i;
      } else if (command.name) {
        command.value += e;
      }
    }

    args.push(command);
    //command = Common.arg();

    return args;
  }

  //remove urls with notheing
  //used for cleaning
  static removeUrls(message, fn) {
    return message.replace(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/g, fn ? fn : "");
  }

  //removes repeating character or character groups aaaaaaaaaaaaa or asdasdasdasdasd
  static removeRepeatingChar(message) {
    var maxChars = 6;
    var a = message.split('');
    var leaveOneRemaining = true;
    var thresholdToStartStriping = maxChars;

    var lastletter = '';
    var stripLength = leaveOneRemaining ? 0 : 1;
    for (var i = a.length; i > 0; i--) {
      var letter = a[i - 1];

      if (lastletter == letter) {
        stripLength++;
      } else if (stripLength > thresholdToStartStriping) {
        a.splice(i, stripLength);
        stripLength = leaveOneRemaining ? 0 : 1;
      } else {
        stripLength = leaveOneRemaining ? 0 : 1;
      }
      lastletter = letter;
    }

    return a.join('');
  }

  //remove line feeds and new lines
  static removeNullsChars(message) {
    return message.replace(/\n|\r/gi, "");
  }

  //truncate message to 200 characters should be used before all the other things
  //TODO: define length in config
  static truncateMessage(message) {
    if (message.length > 200) {
      message = message.substring(0, 200);
    }
    return message;
  }

  //replace thigns with words that can be spoken
  static replaceWavyMen(message) {
    message = message.replace(/\\o\//gi, "hooray");
    message = message.replace(/\\o/gi, "wave");
    message = message.replace(/o\//gi, "wave ack");
    return message;
  }

  //replace thigns with words that can be spoken
  static replaceYesNo(message) {
    message = message.replace(/\(y\)/gi, "thumbs up");
    message = message.replace(/\(n\)/gi, "thumbs down");
    return message;
  }

  static replaceSheepEmojiWithWhateverAarySaid(message) {
    message = message.replace(/🐑/gi, "sheep bar ram ewe");
    return message;
  }

  //cleant a message ready for speaking
  static cleanMessage(message) {
    message = message.trim();
    message = Common.removeUrls(message);
    message = Common.removeRepeatingChar(message);
    message = Common.removeNullsChars(message);
    message = Common.replaceWavyMen(message);
    message = Common.replaceYesNo(message);
    message = Common.replaceSheepEmojiWithWhateverAarySaid(message);
    message = Common.truncateMessage(message);
    return message;
  }

  //make some sfx audio tag
  static makeAudioSSML(url) {
    var ssml = "<audio src='" + url + "' />";
    return ssml;
  };

}

module.exports = Common;
