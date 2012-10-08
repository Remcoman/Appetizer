var ejs = require('ejs');

exports.type = "js";

exports.extension = ".html";

var compile = function (body, file, mode) {
    var compiled;
    try {
        compiled = ejs.compile(body, {filename : file, client : true, compileDebug : mode == "debug"});
    }
    catch(e) {
        throw new Error("Error when compiling template " + file + ". Reason: " + e.message);
    }

    return "module.exports = " + compiled + ";";
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

