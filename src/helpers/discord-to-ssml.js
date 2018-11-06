/***************
  
  SSML = require('./discord-to-ssml'),
  var ssml = new SSML({

  });

 ****************/
var common = require('./common');

(function () {
  "use strict"

  String.prototype.reverse = function () {
    var splitString = this.split(""),
      reverseArray = splitString.reverse(),
      joinArray = reverseArray.join("");
    return joinArray;
  }


  module.exports = function (config) {

    var _this = this;
    this.config = {
      //default : opts
      minLength: 20,
      minLengthBuff: '3000ms',
      tags: []
    }
    
    Object.assign(this.config, config);

    this.tags = [
      { tags: ['__***', '***__'], ssml: 'presody', attr: 'volume="+6dB"' },
      { tags: ['__**', ' **__'], ssml: '', attr: '' },
      { tags: ['__*', '*__'], ssml: '', attr: '' },
      { tags: ['__', '__'], ssml: '', attr: '' },
      { tags: ['***', '***'], ssml: 'emphasis', attr: 'level="strong" volume="+6dB"' },
      { tags: ['**','**'], ssml: 'emphasis', attr: 'level="moderate"' },
      { tags: ['*','*'], ssml: 'emphasis', attr: 'level="reduced"' },
      { tags: ['#','#'], ssml: 'prosody', attr: 'rate="slow"' },
      { tags: ['----', '----'], ssml: 'prosody', attr: 'pitch="-100%" rate="slow"' },
      { tags: ['---','---'], ssml: 'prosody', attr: 'pitch="-100%"' },
      { tags: ['--','--'], ssml: 'prosody', attr: 'pitch="-50%"' },
      { tags: ['+++','+++'], ssml: 'prosody', attr: 'pitch="+100%"' },
      { tags: ['++','++'], ssml: 'prosody', attr: 'pitch="+50%"' },
      { tags: ['~~','~~'], ssml: '', attr: '' },
      { tags: ['```', '```'], ssml: '', attr: '' },
      { tags: ['&&&&&'], ssml: 'break', attr: 'time="500ms"', selfClosing: true },
      { tags: ['&&&&'], ssml: 'break', attr: 'time="400ms"', selfClosing: true },
      { tags: ['&&&'], ssml: 'break', attr: 'time="300ms"', selfClosing: true }
    ];

    this.tags = this.tags.concat(this.tags);

    this.addBuffer = function (message) {
      if (message.length < this.config.minLength) {
        message = message + '<break time="' + this.config.minLengthBuff + '"/> ';
      }
      return message;
    }

    this.build = function (message) {
      this.tags.forEach(function (tag) {

        if (tag.tags.length == 1) {
          var open = common.escapeRegExp(tag.tags[0]);
          // &&&  ~~>  <break time="300" />
          var regex = new RegExp(open, 'g');
          message = message.replace(regex, function (a, b, c) {
            return '<' + tag.ssml + ' ' + tag.attr + '/>';
          });
        }
        
        if (tag.tags.length == 2) {
          var open = common.escapeRegExp(tag.tags[0]),
            close = common.escapeRegExp(tag.tags[1]);
          // ***moderate***   ~~>   <emphasis level="reduced">reduced</emphasis>
          var regex = new RegExp(open + '([^' + open + ']+)' + close, 'g');
          message = message.replace(regex, function (a, b, c) {
            return '<' + tag.ssml + ' ' + tag.attr + '>' + b + '</' + tag.ssml + '>';
          });
        }
      });

      message = this.addBuffer(message);
      message = '<speak>' + message + '</speak>';
      return message;
    }
  }

})();