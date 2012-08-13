var path = require('path');

module.exports = function (extensions) {
    if(extensions) {
        extensions = extensions.map(function (ext) {
            ext = ext.toLowerCase();
            return ext.charAt(0) == "." ? ext : "." + ext;
        });
    }

    var wrapper = function (body, file) {
        var ext = path.extname(file).toLowerCase();
        if((extensions && extensions.indexOf( ext ) == -1) ||
            ext == ".js")
            return body;
        return "module.exports = " + JSON.stringify(body);
    };

    return function (b) {
        b.register(wrapper);
    };
};