/***************

  SSML = require('./discord-to-ssml'),
  var ssml = new SSML({

  });

 ****************/
var Common = require('@helpers/common');

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
      minLengthBuff: '15000ms',
      tags: []
    }

    Object.assign(this.config, config);

    this.tags = [

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
          var open = Common.escapeRegExp(tag.tags[0]);
          // &&&  ~~>  <break time="300" />
          var regex = new RegExp(open, 'g');
          message = message.replace(regex, function (a, b, c) {
            return '<' + tag.ssml + ' ' + tag.attr + '/>';
          });
        }

        if (tag.tags.length == 2) {
          var open = Common.escapeRegExp(tag.tags[0]),
            close = Common.escapeRegExp(tag.tags[1]),
            openRegex = new RegExp(open, 'g'),
            closeRegex = new RegExp(close, 'g');


          // if open and close tags are equal, make sure we have an even number
          // of tags in the string.
          if (open == close) {
            var matches = message.match(openRegex) || [];

            // is odd numebr of matches .. then .. quit
            if (!matches || !matches.length || matches.length % 2) {
              return;
            }
          }


          var openMatches = message.match(openRegex) || [];
          var closeMatches = message.match(closeRegex) || [];
          //if number of closing tags or count of tags is zero... quit
          if (openMatches.length != closeMatches.length || !openMatches.length || !closeMatches) {
            return;
          }


          message = message.replace(openRegex, function (a, b, c) {
            return '<' + tag.ssml + ' ' + tag.attr + '>';
          });

          message = message.replace(closeRegex, function (a, b, c) {
            return '</' + tag.ssml + '>';
          });



        }
      });

      message = this.addBuffer(message);
      message = '<speak>' + message + '</speak>';
      console.log(message);
      return message;
    }
  }

})();
