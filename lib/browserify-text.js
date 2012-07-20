
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
            if((extensions && extensions.indexOf( file.substr(-3).toLowerCase() ) == -1) ||
                file.substr(-3).toLowerCase() == ".js")
                continue;
            files[file].body = "module.exports = " + JSON.stringify(files[file].body);
        }
    };

    return function (b) {
        b.register('pre', wrapper);
    };
};