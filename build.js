var less = require('less'),
    browserify = require('browserify'),
    fs = require('fs'),
    concatenator = require('./lib/concatenator'),
    packer = require('packer'),
    path = require('path');

var config = JSON.parse( fs.readFileSync("config.json", "utf8") );
var dir = process.argv[2] || (__dirname + "/build");

function convertLess(callback) {
    var inFile = path.join(dir, config.less),
        outFile = inFile.substring(0, inFile.lastIndexOf(".")) + ".css";

    less.render(fs.readFileSync(inFile, 'utf8'), { yuicompress: true }, function (e, css) {
        fs.writeFileSync(outFile, css);
        callback();
    });
}

var mainPath = path.join(dir, config.main);
function processJS(callback) {
    var js = concatenator.concat(config.dependencies, dir);
    try {
        js += "\n\n(function () {\n" + browserify({entry : mainPath, cache : false, prelude : false}).bundle() + "\n})()";
    }
    catch(e) {js = e.message;}

    fs.writeFileSync(mainPath, packer.pack(js, false, true));
    callback();
}

var replaceRefs = function (inFile, callback) {
    var src = fs.readFileSync(inFile, 'utf8'),
        entryLess = config.less.charAt(0) == "/" ? config.less.substr(1) : config.less;
        entryCss = config.less.substring(0, config.less.lastIndexOf(".")) + ".css";
    src = src.replace(new RegExp("[/]?" + entryLess, "g"), entryCss);
    fs.writeFileSync(inFile, src);
};

function processHTMLFiles(callback, d) {
    d = d || dir;
    fs.readdirSync(d).forEach(function (file) {
        file = path.join(d, file);
        var stat = fs.statSync(file);
        if(stat.isFile()) {
            var extension = file.substr(file.lastIndexOf(".")+1).toLowerCase();
            if(extension == "html") {
                replaceRefs(file);
            }
        }
        else if(stat.isDirectory()) {
            processHTMLFiles(null, file);
        }
    });

    if(callback) {
        callback();
    }
}

function cleanup(callback, d) {
    d = d || dir;

    fs.readdirSync(d).forEach(function (file) {
        file = path.join(d, file);

        var stat = fs.statSync(file);
        if(stat.isFile()) {
            var extension = file.substr(file.lastIndexOf(".")+1).toLowerCase();
            if(extension == "less" || (extension == "js" && file != mainPath)) {
                fs.unlinkSync(file);
            }
        }
        else if(stat.isDirectory()) {
            cleanup(null, file);
        }
    });

    if(callback) {
        callback();
    }
}

var steps = [convertLess, processJS, processHTMLFiles, cleanup];

(function nextStep() {
   process.nextTick(function () {
       var step = steps.shift();
       if(step)
           step(nextStep);
   });
})();

console.log("Project was build into " + dir);