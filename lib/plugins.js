var fs = require('fs'),
    path = require('path');

var plugins = [];

if(path.existsSync( path.join(__dirname, 'plugins') )) {
    fs.readdirSync(path.join(__dirname, 'plugins')).forEach(function (plugin) {
        plugins.push( require(path.join(__dirname, 'plugins', plugin)) );
    });
}

exports.each = plugins.forEach.bind(plugins);

var getInputFile = function (filePath) {
    return filePath.replace(/\.\w+$/i, "");
}

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

exports.browserify = function () {
    return function (b) {
        //give every plugin a chance to initialize
        plugins.forEach(function (plugin) {
            if(plugin.type == "js" && typeof plugin.browserify == "function") {
                b.register(plugin.extension, plugin.browserify(b));
            }
        });
    };
}