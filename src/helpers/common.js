class Common {
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
  
  static isEmoji(str) {
    if ( str.length < 3 ) return false;
    return (str[0] == ':' && str[str.length-1] == ':');
  };

  static isURL(url) {
    
    // fax, i'm probably a monster
    if ( url.length < 4 ) return false;
    if ( url.substring(0,4) == "http") return true;
    return false;
  }

  static messageIDs(message) {
    var user_ids = message.match(/<@!{0,1}(\d{12,19})>/g);
    //user_ids.channel_id

    if (!user_ids) return [];

    var map = user_ids.map(function (element) {
      var tt = element.replace(/<[@#]{0,1}[!&]{0,1}(\d{12,19})>/g, function (a, b) {
        return b;
      });

      return tt;
    });

    return map;
  }

  static isMessageExcluded(message) {
    return message.startsWith('```');
  }

  static numberClamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  static caseToSpace(nick_name) {
    return nick_name.replace(/([a-z])([A-Z])/g, function (a, b, c) {
      return b + " " + c;
    });
  };

  static replaceSnowFlakes(message, fn) {
    return message.replace(/<[@#]{0,1}[!&]{0,1}(\d{12,19})>/g, function (match, entity_id) {
      return fn(entity_id);
    });
  };

  static replaceURLS(message, fn) {
    return message.replace(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/g, fn ? fn : "");
  }

  static stripRepeatingChar(message) {
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

  static stripNullsChars(message) {
    return message.replace(/\n|\r/gi, "");
  }

  static truncateMessage(message) {
    if (message.length > 200) {
      message = message.substring(0, 200);
    }
    return message;
  }

  static replaceWavyMen(message) {
    message = message.replace(/\\o/gi, "wave");
    message = message.replace(/o\//gi, "wave ack");
    message = message.replace(/\\o\//gi, "hooray");
    return message;
  }

  static replaceYesNo(message) {
    message = message.replace(/\(y\)/gi, "thumbs up");
    message = message.replace(/\(n\)/gi, "thumbs down");
    return message;
  }

  static cleanMessage(message) {
    message = message.trim();
    message = common.replaceURLS(message);
    message = Common.stripRepeatingChar(message);
    message = Common.stripNullsChars(message);
    message = Common.replaceWavyMen(message);
    message = Common.replaceYesNo(message);
    message = Common.truncateMessage(message);
    return message;
  }

  static makeAudioSSML(url) {
    var ssml = "<speak><audio src='" + url + "' /></speak>";
    return ssml;
  };
 
  
}

module.exports = Common;
