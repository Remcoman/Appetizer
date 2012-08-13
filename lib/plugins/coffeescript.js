var coffeescript = require('browserify/node_modules/coffee-script');

exports.type = "js";

exports.extension = ".coffee";

exports.browserify = null; //coffeescript support is hardcoded into browserify :-(

exports.server = function (body, next) {
    try {
        next(null, coffeescript.compile(body));
    }
    catch(e) {
        next(e, null);
    }
}

exports.build = function (body, next) {
    try {
        next(null, coffeescript.compile(body));
    }
    catch(e) {
        next(e, null);
    }
}