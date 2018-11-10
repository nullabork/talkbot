var path = require('path'),
  dirSplit = __dirname.split(path.sep);
dir = dirSplit.pop() && dirSplit.join(path.sep);


function join(a, b) {
  return path.resolve(a, b);
}

module.exports = {
  state: join(dir, '../state.json'),
  auth: join(dir, '../auth.json'),
  config: join(dir, './config'),
  src: join(dir, './src'),
  helpers: join(dir, './src/helpers'),
  commands: join(dir, './src/commands'),
  models: join(dir, './src/models'),
  join: join
}
