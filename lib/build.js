var less = require('less'),
    browserify = require('browserify'),
    fs = require('fs'),
    concatenator = require('./concatenator'),
    packer = require('packer'),
    child_process = require('child_process'),
    path = require('path');

var config = (function readConfig() {
    var configPath = "./config.json";
    if(!path.existsSync(configPath)) {
        configPath = path.join(__dirname, "..", "config.json");
    }

    try {
        return JSON.parse( fs.readFileSync(configPath, "utf8") );
    }
    catch(e) {}
    return {};
})();

var inDir = path.join( (process.argv[2] || __dirname), "src" );
    outDir = path.join( (process.argv[2] || __dirname), "build" );

function copyPaths(callback) {
    var paths = config.copy.concat();

    (function copyNextPath() {
        if(!paths.length)
            return callback();

        var filePath = path.resolve(inDir, paths.shift());

        if(filePath.indexOf(inDir) != 0)
            return copyNextPath();

        child_process.exec('cp -r "' + filePath + '" "' + outDir + '"', function (error, stdout, stderr) {
            if(!error) {
                copyNextPath();
            }
            else {
                throw new Error(error);
            }
        });
    })();
}

function convertLess(callback) {
    var inFile = path.join(inDir, config.less),
        outFile = path.join(outDir, config.less + ".css");

    var outFileDir = path.dirname(outFile);
    if(!path.existsSync(outFileDir)) {
        fs.mkdirSync(outFileDir, 0777);
    }

    less.render(fs.readFileSync(inFile, 'utf8'), { yuicompress: true }, function (e, css) {
        fs.writeFileSync(outFile, css);
        callback();
    });
}

function processJS(callback) {
    var inFile = path.join(inDir, config.main),
        outFile = path.join(outDir, config.main);

    var outFileDir = path.dirname(outFile);
    if(!path.existsSync(outFileDir)) {
        fs.mkdirSync(outFileDir, 0777);
    }

    var js = concatenator.concat(config.dependencies, inDir);
    try {
        js += "\n\n(function () {\n" + browserify({entry : inFile, cache : false, prelude : false}).bundle() + "\n})()";
    }
    catch(e) {js = e.message;}

    fs.writeFileSync(outFile, packer.pack(js, false, true));
    callback();
}

var steps = [copyPaths, convertLess, processJS];

(function nextStep() {
   process.nextTick(function () {
       var step = steps.shift();
       if(step)
           step(nextStep);
   });
})();

console.log("Project was build into " + outDir);