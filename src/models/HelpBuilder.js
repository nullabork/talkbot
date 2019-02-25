var pad = require('pad');
var Common = require('@helpers/common');

class HelpBuilder {

  constructor(data) {
    this.padding = data.padding || " ";
    this.formatKey = data.formatKey || false;
    this.data = data.data || {};
  }

  recurse(padding, data) {

    var max = 0;
    if (!Array.isArray(data)) {
      for (let key in data) {
        if ( typeof key == "string" && key.length > max ) {
          if(this.formatKey) key = Common.camelize(key);
          max = key.length;
        }
      }
    }

    var out = "";
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        let element = data[key];

        //is array ... recurse
        if (Array.isArray(element)) {
          if (isNaN(parseInt(key)))
            out += this.heading(padding, key);
          out += this.recurse(padding + this.padding, element);
        }
        //is object .... recurse
        else if (typeof element == "object") {

          if(element["_heading"]) {
            key = element["_heading"];
          }

          if(element["_data"]) {
            element = element["_data"];
          }

          if (isNaN(parseInt(key)))
            out += this.heading(padding, key);

          out += this.recurse(padding + this.padding, element);
        }

        //is not either of the above :D do some cool stuff:D
        else {
          element = "" + element;
          out += this.row(padding, max, key, element);
        }
      }
    }

    return out;
  }

  row(padding, rightPad, key, value) {



    if (isNaN(parseInt(key))) {

      if(this.formatKey) key = Common.camelize(key);
      return padding + pad(key, rightPad) + " :: " + value.trim() + "\n";

    } else {
      return padding + value + "\n";
    }
  }

  arrayRow(padding, value) {
    return padding + value + "\n";
  }

  heading(padding, value) {
    if(this.formatKey) value = Common.camelize(value);
    return "\n" + "= " + value + " =\n";
  }

  out() {
    return '```asciidoc\n' + this.recurse("", this.data) + "\n ```";
  }
}


module.exports = HelpBuilder;
