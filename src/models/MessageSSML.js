/*jshint esversion: 9 */
  const ssmlConfig = require('@helpers/ssml-dictionary'),
  commands = require('@commands'),
  Common = require('@helpers/common');

class MessageSSML {


  constructor(text, opts, parser) {
    // super(text);

    var find = ssmlConfig
      .map(function (tag) {
        return Common.escapeRegExp(tag.open) + "|" + Common.escapeRegExp(tag.close);
      })
      .join('|');
    this.raw = text;
    this.server = opts.server;
    this.text = text.replace(new RegExp('(' + find + ')', 'g'), ' $1 ');
    this.tagStack = [];
    this.parser = parser;
  }

  compile(token) {
    token = token || "";

    if ( commands.notify ) {
      var alt = commands.notify('token', {token, server: this.server});
      if (alt) {
        return alt;
      }
    }

    var tag = MessageSSML.getRelatedTagInfo(token);
    var closing = this.tagsToClose(tag);
    if (tag) {
      if (!closing.length) {
        this.tagStack.push(tag);
        return tag.openString();
      } else {
        var close = "";
        closing.forEach(function (element) {
          close += element.closeString();
        });
        return close;
      }
    }

    return token;
  }



  tagsToClose(find) {
    var found = [];
    for (let i = 0; i < this.tagStack.length; i++) {
      var tag = this.tagStack[i];
      found.unshift(tag);

      if (find == tag) {
        this.tagStack = this.tagStack.slice(
          (this.tagStack.length - i) - 1,
          this.tagStack.length - 1
        );

        return found;
      }
    }

    return [];
  }

  static getRelatedTagInfo(token) {
    for (let i = 0; i < ssmlConfig.length; i++) {
      if (token == ssmlConfig[i].open || token == ssmlConfig[i].close) {
        return ssmlConfig[i];
      }
    }
    return null;
  }

  messageBuffer() {
    if (this.text.replace(/[^a-z0-9 ]*/ig, "").length < 30) {
      return '<break time="1000ms"/>';
    }
    return '';
  }


  build() {
    var compiled = this.parser.parse();

    this.tagStack.forEach(function (element) {
      compiled.push(element.closeString());
    });

    return '<speak>' +  this.raw + '</speak>';
  }
}

module.exports = MessageSSML;
