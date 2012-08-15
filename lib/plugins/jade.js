var jade = require('jade'),
    runtime = require.resolve('jade/lib/runtime');

var compile = function (body, file, mode) {
    var options = {client : true, filename : file};

    if(mode == "release")
        options.compileDebug = false;

    var src = [
        "var jade = require('jade/lib/runtime'),",
        "    compiledTemplate = " + jade.compile(body, options).toString() + ";",
        "module.exports = function (locals) {return compiledTemplate(locals);}"
    ];
    return src.join("\n");
};

exports.type = "js";

exports.extension = ".jade";

exports.browserify = function (b, mode) {
    b.require(runtime, {target : 'jade/lib/runtime'});
    return function (body, file) {
        return compile(body, file, mode);
    }
}

exports.server = function (body, file, next) {
    next( compile(body, file) );
}

exports.build = function (body, file, mode, next) {
    next( compile(body, file) );
}

