var pad = require('pad');

class HelpBuilder {

  constructor(data){
    this.padding = " ";

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

        if(typeof element == "object" || Array.isArray(element)){
          out += this.heading(padding, key);
        }

        if(Array.isArray(element)){
          for (const item of element) {

            if (typeof item == 'string') {
              out += this.arrayRow(padding, item);
            } else if (typeof item == 'object') {
              out += this.recurse( padding + this.padding, item );
            }

          }
        } else if (typeof element == 'string') {
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

  arrayRow(padding, value) {
    return padding + value + "\n";
  }

  heading(padding, value) {
   return "\n" + "= " + value + " =\n";
  }

  out() {
    return '```asciidoc\n' + this.recurse("", this.data) + "\n ```";
  }
}


module.exports = HelpBuilder;
