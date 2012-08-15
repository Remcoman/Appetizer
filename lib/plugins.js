var fs = require('fs'),
    path = require('path');

var plugins = [];

if(path.existsSync( path.join(__dirname, 'plugins') )) {
    fs.readdirSync(path.join(__dirname, 'plugins')).forEach(function (plugin) {
        plugins.push( require(path.join(__dirname, 'plugins', plugin)) );
    });
}

exports.each = plugins.forEach.bind(plugins);

/**
 * Removes the last extension of a filename. This assumes that the file is a plugin file.
 * @param filePath
 * @return {*}
 */
var getInputFile = function (filePath) {
    return filePath.replace(/\.\w+$/i, "");
}

/**
 * Get the plugin that matches the fileName
 * A fileName matches a plugin if:
 *  - the fileName has two extensions. For example .coffee.js
 *  - the first extension must match a plugin (there must be a plugin that matches .coffee files)
 * @param filePath
 * @return {*} an object that matches the following signature: {plugin : the plugin object, file : the original source file}
 */
exports.getMatch = function (filePath) {
    if(!(/\.[\w]+\.[\w]+$/).test(filePath))
        return null;

    var inFile = getInputFile(filePath);

    var extension = path.extname( inFile );

    var matching = plugins.filter(function (plugin) {
        return plugin.extension == extension;
    });

    return matching.length ? {plugin : matching[0], file : inFile} : null;
}

/**
 * Creates a browserify plugin
 * @return {Function}
 */
exports.browserify = function (mode) {
    return function (b) {
        //give every plugin a chance to initialize
        plugins.forEach(function (plugin) {
            if(plugin.type == "js" && typeof plugin.browserify == "function") {
                b.register(plugin.extension, plugin.browserify(b, mode));
            }
        });
    };
}