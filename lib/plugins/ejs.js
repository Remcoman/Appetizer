var ejs = require('ejs');

exports.type = "js";

exports.extension = ".html";

var compile = function (body, mode) {
    return "module.exports = " + ejs.compile(body, {client : true, compileDebug : mode == "debug"}) + ";";
}

exports.browserify = function (b, mode) {
    return function (body, file) {
        return compile(body, mode);
    }
}

exports.server = function (body, file, next) {
    next( compile(body, "debug") );
}

exports.build = function (body, file, mode, next) {
    next( compile(body, mode == "debug") );
}

