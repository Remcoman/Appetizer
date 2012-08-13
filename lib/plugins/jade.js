var jade = require('jade'),
    runtime = require.resolve('jade/lib/runtime');

var compile = function (body) {
    var src = [
        "var jade = require('jade/lib/runtime'),",
        "    compiledTemplate = " + jade.compile(body, { client: true }).toString() + ";",
        "module.exports = function (locals) {return compiledTemplate(locals);}"
    ];
    return src.join("\n");
};

exports.type = "js";

exports.extension = ".jade";

exports.browserify = function (b) {
    b.require(runtime, {target : 'jade/lib/runtime'});
    return function (body) {
        return compile(body);
    }
}

exports.server = function (body, next) {
    next( compile(body) );
}

exports.build = function (body, next) {
    next( compile(body) );
}

