var MessageParser = require('./MessageParser'),
  ssmlConfig = require('@config/ssml'),
  common = require('@helpers/common');

class MessageSSML extends MessageParser {
  constructor (text) {
    super(text);

    var find = ssmlConfig
      .map(function(tag){
        return common.escapeRegExp(tag.open) + "|" + common.escapeRegExp(tag.close);
      })
      .join('|');

    this.text = text.replace(new RegExp('(' + find + ')', 'g'), ' $1 ');
    this.tagStack = [];
  }

  compile (token) {
    token = token || "";

    var tag = MessageSSML.getRelatedTagInfo(token);
    var closing = this.tagsToClose(tag);
    if (tag) {
      if(!closing.length) {
        this.tagStack.push(tag);
        return tag.openString();
      } else {
        var close = "";
        closing.forEach(function(element) {
          close += element.closeString();
        });
        return close;
      }
    }

    return token;
  }



  tagsToClose (find) {
    var found = [];
    for (let i = 0; i < this.tagStack.length; i++) {
      var tag = this.tagStack[i];
      found.unshift(tag);

      if(find == tag) {
        this.tagStack = this.tagStack.slice(
          (this.tagStack.length - i) - 1,
          this.tagStack.length - 1
        );

        return found;
      }
    }

    return [];
  }

  static getRelatedTagInfo (token) {
    for (let i = 0; i < ssmlConfig.length; i++) {
      if(token == ssmlConfig[i].open || token == ssmlConfig[i].close) {
        return ssmlConfig[i];
      }
    }
    return null;
  }

  messageBuffer () {
    if (this.text.length < 20) {
      return '<break time="4000ms"/>';
    }
    return '';
  }


  build () {
    var compiled = this.parse();

    this.tagStack.forEach(function(element) {
      compiled.push(element.closeString());
    });

    return '<speak>' + compiled.join(" ") + this.messageBuffer() + '</speak>';
  }
}

module.exports = MessageSSML;
