var path = require('path');

module.exports = function (extensions) {
    if(extensions) {
        extensions = extensions.map(function (ext) {
            ext = ext.toLowerCase();
            return ext.charAt(0) == "." ? ext : "." + ext;
        });
    }

    var wrapper = function (b) {
        var files = b.files;

        for(var file in files) {
            var ext = path.extname(file).toLowerCase();
            if((extensions && extensions.indexOf( ext ) == -1) ||
                ext == ".js")
                continue;
            files[file].body = "module.exports = " + JSON.stringify(files[file].body);
        }
    };

    return function (b) {
        b.register('pre', wrapper);
    };
};