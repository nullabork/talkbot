var ChildProc = require('child_process');

var s = function () {
  console.log(Array.from(arguments));
}
console.log(s('asd', 'asd2', 'asd3'));
