var request = require('sync-request');
var res = request('GET', "http://api.chrisvalleskey.com/fillerama/get.php?count=2&format=json&show=futurama",{
  json : true
});

var json = JSON.parse(res.getBody('utf8'));
console.log(json.db[0].source + ": " + json.db[0].quote);
