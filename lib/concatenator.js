var fs = require('fs'),
    path = require('path');

exports.concat = function (files, base) {
    var result = [];
    files.forEach(function (file) {
        var filePath = path.join(base, file);

        if(!path.existsSync(filePath)) {
            throw new Error("File " + filePath + " could not be found");
        }

        try {
            result.push( fs.readFileSync(filePath, 'utf8') );
        }
        catch(e) {
            throw new Error("File " + filePath + " could not be opened (" + e.message + ")");
        }
    });
    return result.join("\n\n");
};