var pad = require('pad');

class HelpBuilder {

  constructor(data){
    this.padding = "  ";

    this.data = data || {};
  }


  recurse( padding, data) {

    var max = 0;
    for (const key in data) {
      if(typeof key == "string" && key.length > max){
        max = key.length;
      }
    }

    var out = "";
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];

        if(typeof element == "object"){
          out += this.heading(padding, key);
        }

        if (typeof element == 'string') {
          out += this.row(padding,max, key, element);
        } else {
          out += this.recurse(padding + this.padding, element);
        }
      }
    }

    return out;
  }

  row(padding, rightPad, key, value) {
    return padding + pad(key, rightPad) + " :: " + value + "";
  }

  heading(padding, value) {
   return "\n\n" + padding + "==" + value + "==\n\n";
  }

  out() {
    return '"```asciidoc \n' + this.recurse("", this.data) + "\n ```";
  }
}


module.exports = HelpBuilder;
