class MessageParser {
  constructor(text) {
    this.text = text;
    this.compiled = [];
    this.index = 0;
  }

  tokensRemaining() {
    return this.index < this.text.length;
  }

  nextToken() {
    if (!this.tokensRemaining()) {
      return null;
    }

    let token = '';
    let char = this.text.charAt(this.index);

    if (/\s/.test(char)) {
      this.index++;
      return this.nextToken();
    }

    while (/\S/.test(char) && this.tokensRemaining()) {
      token += char;
      char = this.text.charAt(++this.index);
    }
    return token;
  }

  compile(token) {
    return token;
  }

  parse() {
    let token;
    while (token = this.nextToken()) {
      if (typeof this.compile == 'function') {
        var modified = this.compile.apply(this, [token]);
        if (modified) token = modified;
        this.compiled.push(modified);
      }
    }

    return this.compiled;
  }


}

module.exports = MessageParser;
