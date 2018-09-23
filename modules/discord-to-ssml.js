(function () {
  "use strict"

  String.prototype.reverse = function () {
    var splitString = this.split(""),
      reverseArray = splitString.reverse(),
      joinArray = reverseArray.join("");
    return joinArray;
  }

  String.prototype.escapeRegExp = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }


  exports.SSML = function (config) {

    var _this = this;
    this.config = {
      //default : opts
      minLength : 20,
      minLengthBuff : '500ms'
    }

    //override any config
    Object.assign(this.config, config);

    this.tags = [
      { md: '__***', ssml: '', attr: '' },     //underline bold italics
      { md: '__**', ssml: '', attr: '' },     //Underline bold
      { md: '__*', ssml: '', attr: '' },     //Underline italics
      { md: '__', ssml: '', attr: '' },     //underline
      { md: '***', ssml: 'emphasis', attr: 'level="strong"' },     //bold italics
      { md: '**', ssml: 'emphasis', attr: 'level="moderate"' },     //bold
      { md: '*', ssml: 'emphasis', attr: 'level="reduced"' },     //italics strong,moderate,none,reduced
      { md: '#', ssml: 'prosody', attr: 'rate="slow"' },          //not mark down
      { md: '~~', ssml: '', attr: '' },     //strikethrough
      { md: '```', ssml: '', attr: '' },     //codeblock
    ];

    this.addBuffer = function(message) {
      if(message.length < this.config.minLength) {
        message = '<break time=' + this.config.minLengthBuff + '/> ' + message;
      }
      return message;
    }

    this.build = function (message) {
      tags.forEach(function (tag) {

        var open = tag.md.escapeRegExp(),
          close = tag.md.reverse().escapeRegExp(),
          regex = new RegExp(open + '([^' + open + ']*)' + close, 'g');

        message = message.replace(regex, function (a, b, c) {
          return '<' + tag.ssml + ' ' + tag.attr + '>' + b + '</' + tag.ssml + '>';
        });

      });

      message = this.addBuffer(message);

      return '<speak>' + message + '</speak>';
    }
  }

})();