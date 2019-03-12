var pad = require('pad');
var Common = require('@helpers/common');

class CommentBuilder {

  constructor(data) {
    this.padding = data.padding || " ";
    this.formatKey = typeof data.formatKey != 'undefined' ? data.formatKey : true;
    this.data = data.data || {};
    this.keyMap = data.keyMap || {};
  }

  static create(data) {
    let builder = new CommentBuilder(data);
    return builder.out();
  }

  recurse(padding, data) {


    var out = "";
    if(typeof data["_heading"] != 'undefined') {
      out += this.heading(padding, data["_heading"]);
    }

    if(typeof data["_data"] != 'undefined') {
      data = data["_data"];
    }

    var max = 0;
    if (!Array.isArray(data) && typeof data != 'string' ) {
      for (let key in data) {
        if ( typeof key == "string" && key.length > max ) {
          // /if(this.formatKey) key = Common.camelize(key);
          max = key.length;
        }
      }
    }



    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        let element = data[key];

        //is array ... recurse
        if (element != null && Array.isArray(element)) {

          if (isNaN(parseInt(key)))
            out += this.heading(padding, key);

          out += this.recurse(padding + this.padding, element);
        }
        //is object .... recurse
        else if (element != null && typeof element == "object") {
          if (isNaN(parseInt(key)))
            out += this.heading(padding, key);

          out += this.recurse(padding + this.padding, element);
        }
        //is not either of the above :D do some cool stuff:D
        else
        {
          element = "" + element;
          out += this.row(padding, max, key, element);
        }
      }
    }

    return out;
  }

  row(padding, rightPad, key, value) {
    if (isNaN(parseInt(key))) {
      if(this.keyMap && this.keyMap[key]) key = this.keyMap[key];
      //if(this.formatKey) key = Common.camelize(key);

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
    return '```asciidoc\n' + this.recurse("", this.data) + "```";
  }
}


module.exports = CommentBuilder;
