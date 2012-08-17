var fs = require('fs'),
    path = require('path');

var plugins = [];

if(path.existsSync( path.join(__dirname, 'plugins') )) {
    fs.readdirSync(path.join(__dirname, 'plugins')).forEach(function (plugin) {
        plugins.push( require(path.join(__dirname, 'plugins', plugin)) );
    });
}

exports.each = plugins.forEach.bind(plugins);

var findPluginForExtension = function (ext) {
    var matching = plugins.filter(function (plugin) {
        return plugin.extension == ext;
    });
    return matching.length > 0 ? matching[0] : null;
}

var PluginInfo = {
    getOutFile : function (dir) {
        return path.join(dir, path.basename(this.inFile) + "." + this.plugin.type);
    }
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
    var extMatch = filePath.match(/(\.[\w]+)(\.[\w]+)?$/);

    var pluginInfo = Object.create(PluginInfo, {
        inFile : {
            value : filePath
        },
        plugin : {
            value : null,
            writable : true
        }
    });

    //pop last extension
    if(extMatch[2]) {
        pluginInfo.inFile = filePath.replace(/\.\w+$/i, "");
    }

    pluginInfo.plugin = findPluginForExtension( path.extname( pluginInfo.inFile) );

    //no plugin found
    if(!pluginInfo.plugin)
        return null;

    //last extension does not match plugin type
    if(extMatch[2] && extMatch[2].substr(1) != pluginInfo.plugin.type)
        return null;

    return pluginInfo;
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