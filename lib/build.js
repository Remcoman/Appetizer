var browserify = require('browserify'),
    fs = require('fs'),
    packer = require('packer'),
    child_process = require('child_process'),
    browserify_text = require('./browserify-text'),
    browserify_strict = require('./browserify-strict'),
    browserify_concat = require('./browserify-concat'),
    configReader = require('./configReader'),
    plugins = require('./plugins'),
    path = require('path');

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

    (function copyNextPath() {
        if(!paths.length)
            return next();

        var filePath = path.resolve(inDir, paths.shift());

        if(filePath.indexOf(inDir) != 0)
            return copyNextPath();

        child_process.exec('cp -r "' + filePath + '" "' + outDir + '"', function (error, stdout, stderr) {
            if(!error) {
                copyNextPath();
            }
            else {
                next( new Error(error) );
            }
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
    if(!path.existsSync(outFileDir)) {
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
        outStream.on('drain', function () {
            next();
        });
    }
}

function processMain(next) {
    var inFile = path.join(inDir, config.main),
        outFile = path.join(outDir, config.main);

    var outFileDir = path.dirname(outFile);
    if(!path.existsSync(outFileDir)) {
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
       return;
   }

   process.nextTick(function () {
       var step = steps.shift();
       if(step)
           step(nextStep);
       else
           console.log("Project was build into " + outDir + ". Time taken: " + (Date.now() - startTime) + "ms");
   });
})(null);