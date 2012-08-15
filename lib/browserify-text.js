/**
 * User: remcokrams
 * Date: 14-08-12
 * Time: 11:03
 */

var path = require('path');

/**
 * This plugin allows you to require text files
 * @param extensions an array of extensions. If specified only file with these extensions are text files. Otherwise all non js files are text files.
 * @return {Function}
 */
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