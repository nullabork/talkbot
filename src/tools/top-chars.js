/*jshint esversion: 9 */
//npm imports
require('module-alias/register');

var paths = require('@paths');
var fs = require('fs');

function loadServer(path)
{
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path));
    }
    return null;
}

fs.readdir(paths.config, (err, files) => {
    if (err) return console.log('Unable to scan directory: ' + err);

    files.forEach(file => {
        var server = loadServer(paths.config + '\\' + file);
        console.log(server.server_name + ': ' + (!server.stats ? 0 : server.stats.characterCount));
    });
});
