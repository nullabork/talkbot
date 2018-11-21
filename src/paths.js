var path = require('path'),
  dirSplit = __dirname.split(path.sep),
  dir = dirSplit.pop() && dirSplit.join(path.sep);


function join(a, b) {
  return path.resolve(a, b);
}

function make(a) {
  return path.resolve(dir, a);
}

function include(aliased_path) {
  var a = aliased_path.match(/^@([^@\\/]*)[\\/]{0,1}(.*)/);
  if (a && a.length) {
    var alias = a[1],
      shortPath = a[2];

    if (this[alias]) {
      var expandedPath = path.resolve(this[alias], shortPath);
      return require(expandedPath);
    }
  }

  return null;
}

//dir is the root project directory assuming that is one directory back from
//this location
var paths = {
  //state & auth  file is found outside of this project. outside of git etc
  //eventually i want to make it so the deploy creates symbolic links to config
  //stuff inside the project.
  state: make('config/state.json'),
  auth: make('config/auth.json'),


  config: make('config'),
  src: make('src'),
  helpers: make('src/helpers'),
  commands: make('src/commands'),
  models: make('src/models'),

  //utils
  join: join,
  resolve: join,
  require: include
}

module.exports = paths;
