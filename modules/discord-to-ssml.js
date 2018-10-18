/***************
  
  SSML = require('./discord-to-ssml'),
  var ssml = new SSML({

  });

 ****************/


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


  exports.default = function (config) {

    var _this = this;
    this.config = {
      //default : opts
      minLength: 20,
      minLengthBuff: '3000ms',
      tags: []
    }

    //override any config
    // ***reduced***    ~~>   <emphasis level="reduced">reduced</emphasis>
    // ***strong***     ~~>   <emphasis level="strong">strong</emphasis>
    // ***moderate***   ~~>   <emphasis level="moderate">moderate</emphasis>
    Object.assign(this.config, config);

    this.tags = [
      { md: '__***', ssml: '', attr: ''},
      { md: '__**', ssml: '', attr: ''},
      { md: '__*', ssml: '', attr: ''},
      { md: '__', ssml: '', attr: ''},
      { md: '***', ssml: 'emphasis', attr: 'level="strong"'},
      { md: '**', ssml: 'emphasis', attr: 'level="moderate"'},
      { md: '*', ssml: 'emphasis', attr: 'level="reduced"'},
      { md: '#', ssml: 'prosody', attr: 'rate="slow"'},
      { md: '~~', ssml: '', attr: ''},
      { md: '```', ssml: '', attr: ''},
      { md: '&&&&&', ssml: 'break', attr: 'time="500ms"', selfClosing: true},
      { md: '&&&&', ssml: 'break', attr: 'time="400ms"', selfClosing: true},
      { md: '&&&', ssml: 'break', attr: 'time="300ms"', selfClosing: true }
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

        var open = tag.md.escapeRegExp(),
          close = tag.md.reverse().escapeRegExp();
          
        if(tag.selfClosing){
          // &&&  ~~>  <break time="300" />
          var regex = new RegExp(open, 'g');
          message = message.replace(regex, function (a, b, c) {
            return '<' + tag.ssml + ' ' + tag.attr + '/>';
          });
        } else {
          // ***moderate***   ~~>   <emphasis level="reduced">reduced</emphasis>
          var regex = new RegExp(open + '([^' + open + ']*)' + close, 'g');
          message = message.replace(regex, function (a, b, c) {
            return '<' + tag.ssml + ' ' + tag.attr + '>' + b + '</' + tag.ssml + '>';
          });
        }
      });

      message = this.addBuffer(message);
      return '<speak>' + message + '</speak>';
    }
  }

})();