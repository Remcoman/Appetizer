var less = require('less');

exports.type = "css";

exports.extension = ".less";

exports.browserify = null;

exports.server = function (body, next) {
    try {
        less.render(body, function (e, css) {
            if(e)
                throw e;
            next(null, css);
        });
    }
    catch(e) {
        var errorCSS = [
            'body:before {',
            '   content:' + JSON.stringify("There was a error in your Less file: " + e.message) + ';',
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

exports.build = function (body, next) {
    less.render(body, { yuicompress: true }, next);
}