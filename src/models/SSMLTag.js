class SSMLTag {
  constructor(details) {
    this.open = null;
    this.close = null;
    this.type = null;
    this.attributes = {};
    Object.assign(this, details);
  }

  openString() {
    return "<" + this.type + " " + this.getAttributesString() + " >";
  }

  closeString() {
    return "</" + this.type + ">";
  }

  getAttributesString() {
    var attrs = "";
    for (let key in this.attributes) {
      if (this.attributes.hasOwnProperty(key)) {
        let value = this.attributes[key];
        attrs += " " + key + "=\"" + value + "\"";
      }
    }
    return attrs;
  }
}

module.exports = SSMLTag;
