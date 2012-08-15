var less = require('less'),
    path = require('path');

exports.type = "css";

exports.extension = ".less";

exports.browserify = null;

exports.server = function (body, file, next) {
    try {
        less.render(body, {paths : [path.dirname(file)]}, function (e, css) {
            if(e)
                throw e;
            next(null, css);
        });
    }
    catch(e) {
        var errorCSS = [
            'body:before {',
            '   content:' + JSON.stringify("There was a error in your Less file: " + e.message.replace(/[\r\n]/g, "")) + ';',
            '   display:block;',
            '   padding:10px;',
            '   margin:0 auto;',
            '   color:#fff;',
            '   background-color:#c00;',
            '   font:20px sans-serif;',
            '}'
        ];
        next( null, errorCSS.join("\n") );
    }
}

exports.build = function (body, file, next, mode) {
    var opts = {paths : [path.dirname(file)]};

    if(mode == "release") {
        opts.yuicompress = true;
        less.render(body, opts, next);
    }
    else {
        less.render(body, opts, next);
    }
}