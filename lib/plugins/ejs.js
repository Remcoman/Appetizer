var ejs = require('ejs');

exports.type = "js";

exports.extension = ".html";

var compile = function (body, file, mode) {
    return "module.exports = " + ejs.compile(body, {filename : file, client : true, compileDebug : mode == "debug"}) + ";";
}

exports.browserify = function (b, mode) {
    return function (body, file) {
        return compile(body, file, mode);
    }
}

exports.server = function (body, file, next) {
    next( compile(body, file, "debug") );
}

exports.build = function (body, file, mode, next) {
    next( compile(body, file, mode == "debug") );
}

