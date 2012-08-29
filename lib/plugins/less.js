var less = require('less'),
    path = require('path'),
    mime = require('mime'),
    fs = require('fs');

less.tree.functions.base64 = function (url) {
    if(!(url instanceof less.tree.URL))
        throw new Error("Base64 function expects a url");

    var searchPaths = url.paths.concat(),
        curSearchPath,
        resolvedPath;

    while(curSearchPath = searchPaths.pop()) {
        var filePath = path.resolve(curSearchPath, url.value.value);
        if(fs.existsSync( filePath ) && fs.statSync( filePath ).isFile()) {
            resolvedPath = filePath;
            break;
        }
    }

    if(resolvedPath) {
        return new(less.tree.URL)({
            data : ',' + fs.readFileSync(resolvedPath, 'base64'),
            mime : mime.types[ path.extname(resolvedPath).substr(1) ],
            charset : '',
            base64 : ';base64'
        });
    }
    else {
        throw new Error("File " + url.value.value + " could not be found");
    }
}

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

exports.build = function (body, file, mode, next) {
    var opts = {paths : [path.dirname(file)]};

    if(mode == "release") {
        opts.yuicompress = true;

        less.render(body, opts, next);
    }
    else {
        less.render(body, opts, next);
    }
}