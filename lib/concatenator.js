var fs = require('fs'),
    path = require('path');

exports.concat = function (files, base) {
    var result = [];
    files.forEach(function (file) {
        result.push( fs.readFileSync(path.join(base, file), 'utf8') );
    });
    return result.join("\n\n");
};