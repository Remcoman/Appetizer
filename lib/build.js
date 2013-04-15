var browserify = require('browserify'),
    fs = require('fs'),
    child_process = require('child_process'),
    configReader = require('./configReader'),
    uglify = require('uglify-js'),
    plugins = require('./plugins'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync;

var browserify_text = require('./browserify-text'),
    browserify_strict = require('./browserify-strict'),
    browserify_json = require('./browserify-json'),
    browserify_concat = require('./browserify-concat'),
    browserify_pathvars = require('./browserify-pathvars');

var projectDir = process.argv[2] || process.cwd(),
    mode = process.argv[3] || "release",
    inDir = path.join( projectDir, "src"),
    outDir = path.join( projectDir, "build"),
    config = configReader.read(projectDir);

/**
 * Copy the paths specified in the copy property
 * @param {Function} next
 */
function copyPaths(next) {
    var paths = config.copy.concat();

    var toExclude = config.exclude_from_copy || [];
    if(!Array.isArray(toExclude))
        toExclude = [toExclude];

    //create a array of regex objects from the exclude_from_copy config value
    var toExcludeRegexes = toExclude.map(function (pattern) {
        var regex = pattern.replace(/([\.\-\[\]\^])/g, "\\$1")
                           .replace(/\*/g, ".*?");
        return new RegExp(regex, "g");
    });

    //this function checks if some regex matches the given src
    var matchesExcludeRegex = function (src) {
        return toExcludeRegexes.some(function (regex) {
            return regex.test(src);
        });
    }

    var makePath = function (target, base, callback) {
        var pathParts = target.split(path.sep),
            curPart = pathParts.shift(),
            dir = path.join(base, curPart);

        var nextPath = function () {
            var rest = pathParts.join(path.sep);
            if(rest) {
                makePath(rest, path.join(base, curPart), callback);
            }
            else {
                callback();
            }
        };

        if(!existsSync(dir)) {
            fs.mkdir(dir, function (e) {
                if(e)
                    return next(e);
                nextPath();
            });
        }
        else {
            nextPath();
        }
    };

    var copyPath = function (from, to, callback) {
        if( matchesExcludeRegex( path.basename(from) ) )
            return process.nextTick(callback);

        var stat = fs.statSync(from);

        if(stat.isFile()) {
            try {
                var inStream = fs.createReadStream(from),
                    outStream = fs.createWriteStream(to);

                inStream.pipe(outStream);
                inStream.on('end', callback);
                outStream.on('error', next);
            }
            catch(e) {
                next(e);
            }
        }
        else if(stat.isDirectory()) {
            var files = fs.readdirSync(from);

            if(!fs.existsSync(to)) {
                fs.mkdirSync(to);
            }

            (function copyNextEntry(e) {
                if(e)
                    return next(e);
                else if(!files.length)
                    return callback();

                var f = files.shift(),
                    fileFrom = path.join(from, f),
                    fileTo = path.join(to, f);

                copyPath(fileFrom, fileTo, copyNextEntry);
            })();
        }
    };

    (function copyNextPath() {
        if(!paths.length)
            return next();

        var copySrc = paths.shift(),
            resolvedSrc = path.resolve(inDir, copySrc),
            resolvedDest = path.resolve(outDir, copySrc);

        if(resolvedSrc.indexOf(inDir) != 0 || !existsSync(resolvedSrc)) {
            console.log("Warning could not copy " + resolvedSrc + ", because it can not be found or is not in app path");
            return copyNextPath();
        }

        var mkPath = copySrc;
        if(fs.statSync(resolvedSrc).isFile())
            mkPath = path.dirname(copySrc);

        makePath(mkPath, outDir, function () {
            copyPath(resolvedSrc, resolvedDest, copyNextPath);
        });
    })();
}


/**
 * Convert the less file in the src directory and output it in the dest directory
 * @param {Function} next
 */
function convertStyle(next) {
    var inFile = path.join(inDir, config.style),
        outFile = path.join(outDir, config.style);

    var outFileDir = path.dirname(outFile);
    if(!existsSync(outFileDir)) {
        fs.mkdirSync(outFileDir, 0777);
    }

    var pluginInfo = plugins.getMatch(inFile);

    if(pluginInfo) {

        var body = fs.readFileSync(pluginInfo.inFile, 'utf8');

        pluginInfo.plugin.build(body, pluginInfo.inFile, mode, function (e, body) {
            if(e)
                return next(e);
            fs.writeFileSync(pluginInfo.getOutFile(outFileDir), body);
            next();
        });
    }
    else {
        var inStream = fs.createReadStream(inFile),
            outStream = fs.createWriteStream(outFile);
        inStream.pipe(outStream);
        inStream.on('end', function () {
            next();
        });
    }
}

/**
 * Create the output js file using browserify
 * @param {Function} next
 */
function processMain(next) {
    var inFile = path.join(inDir, config.main),
        outFile = path.join(outDir, config.main);

    var outFileDir = path.dirname(outFile);
    if(!existsSync(outFileDir)) {
        fs.mkdirSync(outFileDir, 0777);
    }

    var pluginInfo = plugins.getMatch(inFile);

    var js, error;
    try {
        var b = browserify({cache : false, prelude : false, debug : mode == "debug"});

        b.on('syntaxError', function (e) {
            error = e;
        });

        b.use( browserify_concat(config.dependencies, inDir) );
        b.use( browserify_text([".xml", ".css", ".txt"]) );
        b.use( plugins.browserify(mode) );
        b.use( browserify_json() );
        b.use( browserify_strict() );
        b.use( browserify_pathvars(config.pathvars, {DEPLOY : mode}) );

        if(pluginInfo) {
            b.addEntry(pluginInfo.inFile);
        }
        else {
            b.addEntry(inFile);
        }

        js = "\n\n(function () {\n" + b.bundle() + "\n})()";
    }
    catch(e) {
        error = e;
    }

    //we have to catch the error on the next tick because of the syntaxError
    process.nextTick(function () {
        if(error)
            return next(error);

        if(pluginInfo)
            outFile = pluginInfo.getOutFile(outFileDir);

        if(mode == "release") {
            var originalSource = path.join(path.dirname(outFile), path.basename(outFile, ".js") + ".source.js");

            if(config.source_map) {
                fs.writeFileSync(originalSource, js);
            }

            var toplevel = uglify.parse(js, {
                filename : path.basename(originalSource),
                toplevel : toplevel
            });

            var compress = { warnings: false};
            uglify.merge(compress, {});
            toplevel.figure_out_scope();
            var sq = uglify.Compressor(compress);
            toplevel = toplevel.transform(sq);

            var map = null;
            if (config.source_map) map = uglify.SourceMap({
                file: config.source_map,
                orig: null,
                root: "."
            });
            var stream = uglify.OutputStream({ source_map: map });
            toplevel.print(stream);

            if(map) {
                stream += "\n//@ sourceMappingURL=" + path.basename(config.source_map);
                fs.writeFileSync(path.join(outDir, config.source_map), map);
            }

            js = stream;
        }

        fs.writeFileSync(outFile, js);

        next();
    });
}

var steps = [copyPaths, convertStyle, processMain],
    startTime = Date.now();

(function nextStep(e) {
   if(e) {
       console.error("There was an error building your project. Aborting......");
       console.error(e.message);
       process.exit(1);
   }

   process.nextTick(function () {
       var step = steps.shift();
       if(step)
           step(nextStep);
       else
           console.log("Project was build into " + outDir + ". Time taken: " + (Date.now() - startTime) + "ms");
   });
})(null);