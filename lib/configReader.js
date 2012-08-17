/**
 * User: remcokrams
 * Date: 17-08-12
 * Time: 09:51
 */

var path = require('path'),
    fs = require('fs');

var readConfig = function (dir) {
    var configPath = path.join(dir, "config.json"),
        configData = JSON.parse( fs.readFileSync( configPath, "utf8") );
    return configData;
};

/*
    Read the default config data once
    So you need to restart the server when you change the default config
*/
var defaultConfigData = readConfig( path.join(__dirname, "..") );

exports.read = function (projectDir) {
    var projectConfigData = {}; //default to an empty object

    try {
        projectConfigData = readConfig(projectDir);
    }
    catch(e) {}

    var mergedConfigData = Object.create(defaultConfigData);
    Object.keys(projectConfigData).forEach(function (prop) {
        mergedConfigData[prop] = projectConfigData[prop];
    });

    return mergedConfigData;
}