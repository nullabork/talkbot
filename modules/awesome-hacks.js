var ssaml = require('./discord-to-ssml');

(function() {"use strict"

  var hacks = {};

  hacks["01-trim"] = function(channel_id, message) {
    return message.trim();
  };
  
  hacks["02-stripurls"] = function(channel_id, message) {
    return message.replace(/(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/g, "");
  };
  
  hacks["03-replacebullshit"] = function(channel_id, message) {
    return message.replace(/\n|\r/gi, "");
  };
  
  hacks["10-thumbsup"] = function(channel_id, message) {
    return message.replace(/\(y\)/gi, "thumbs up");
  };    
  hacks["11-thumbsdown"] = function(channel_id, message) {
    return message.replace(/\(n\)/gi, "thumbs down");
  };    
  hacks["12-hooray"] = function(channel_id, message) {
    return message.replace(/\\o\//gi, "hooray");
  };    
  hacks["20-wave"] = function(channel_id, message) {
    return message.replace(/o\//gi, "wave ack");
  };    
  hacks["21-wave2"] = function(channel_id, message) {
    return message.replace(/\\o/gi, "wave");
  };    
  
  hacks["12-repeating-chars"] = function(channel_id, message) {
    var maxChars = 6;
    var a = message.split('');
    var leaveOneRemaining = true;
    var thresholdToStartStriping = maxChars;

    var lastletter = '';
    var stripLength = leaveOneRemaining?0:1;
    for (var i = a.length; i > 0; i--) {
      var letter = a[i - 1];

      if (lastletter == letter) {
          stripLength++;
      } else if (stripLength > thresholdToStartStriping) {
          a.splice(i, stripLength);
          stripLength = leaveOneRemaining?0:1;;
      } else {
          stripLength = leaveOneRemaining?0:1;;
      }
      lastletter = letter;
    }
    
    return a.join('');
  };
  
  hacks["99-big-long-message"] = function(channel_id, message) {
    if ( message.length > 200 ) message = message.substring(0,200);
    return message;
  };

  hacks["ssmal-build"] = function(channel_id, message) {
    return ssaml.build(message);
  };
  
  /**
    * parse() a message and apply awesome hacks
    **/
  exports.parse = function(channel_id, message) {
    for ( var hack in hacks )
    {
      message = hacks[hack](channel_id, message);
    }
    return message;
  };

})();