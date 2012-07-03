/**
 * Created with JetBrains PhpStorm.
 * User: remcokrams
 * Date: 02-07-12
 * Time: 21:20
 * To change this template use File | Settings | File Templates.
 */
var fs = require('fs'),
    path = require('path');

exports.concat = function (files, base) {
    var result = [];
    files.forEach(function (file) {
        result.push( fs.readFileSync(path.join(base, file), 'utf8') );
    });
    return result.join("\n\n");
};