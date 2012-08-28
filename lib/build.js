var browserify = require('browserify'),
    fs = require('fs'),
    packer = require('packer'),
    child_process = require('child_process'),
    browserify_text = require('./browserify-text'),
    browserify_strict = require('./browserify-strict'),
    browserify_concat = require('./browserify-concat'),
    configReader = require('./configReader'),
    plugins = require('./plugins'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync;

var projectDir = process.argv[2] || process.cwd(),
    mode = process.argv[3] || "release",
    inDir = path.join( projectDir, "src"),
    outDir = path.join( projectDir, "build"),
    config = configReader.read(projectDir);

/**
 * Copy the paths specified in the copy property
 * @param callback
 */
function copyPaths(next) {
    var paths = config.copy.concat();

    var makePath = function (filePath, base, callback) {
        var pathParts = filePath.split(path.sep),
            dir = path.join(base, pathParts.shift());
        if(!fs.existsSync(dir)) {
            fs.mkdir(dir, function (e) {
                if(e)
                    return next(e);
                var rest = pathParts.join(path.sep);
                if(rest) {
                    makePath(rest, base, callback);
                }
                else {
                    callback();
                }
            });
        }
        else {
            callback();
        }
    };

    var copyPath = function (from, to, callback) {
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

        if(resolvedSrc.indexOf(inDir) != 0)
            return copyNextPath();

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
 * @param callback
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
        b.use( browserify_text([".css", ".html", ".txt"]) );
        b.use( plugins.browserify(mode) );
        b.use( browserify_strict() );

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

        if(mode == "release")
            js = packer.pack(js, false, true);

        if(pluginInfo)
            outFile = pluginInfo.getOutFile(outFileDir);

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