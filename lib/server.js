var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    less = require('less'),
    keys = require('./keys'),
    concatenator = require('./concatenator'),
    browserify = require('browserify');

var config,
    action = process.argv[2] || "start";

function readConfig() {
    var configPath = "./config.json";
    if(!path.existsSync(configPath)) {
        configPath = path.join(__dirname, "..", "config.json");
    }

    try {
        config = JSON.parse( fs.readFileSync(configPath, "utf8") );
    }
    catch(e) {}
}

readConfig();

function run() {
    var dir = path.join( (process.argv[3] || __dirname), "src" )

    var app = express.createServer();
    app.use(app.router);
    app.use(express.static(dir));

    app.get(path.join("/", config.main), function (req, res, next) {
        var file = path.join(dir, config.main);

        res.contentType("text/javascript");

        var js = concatenator.concat(config.dependencies, dir);
        try {
            js += "\n\n(function () {\n" + browserify({entry : file, cache : false, prelude : false, debug : true}).bundle() + "\n})()";
        }
        catch(e) {js = e.message;}

        res.send(js);
    });

    app.get(/(.+\.less\.css$)/i, function (req, res, next) {
        var file = path.join(dir, req.params[0].replace(/\.css$/i, ""));

        if(!path.existsSync(file))
            return next();

        res.contentType("text/css");

        try {
            less.render(fs.readFileSync(file, 'utf8'), function (e, css) {
                res.send(css);
            });
        }
        catch(e) {
            res.send(e.message);
        }
    });

    fs.watchFile("config.json", readConfig);

    var close = function () {
        app.close();
        fs.unwatchFile("config.json");
        process.exit(0);
    };

    app.get('/quit', close);
    keys.on('q', close);

    app.listen(config.port);

    console.log("Server started on port " + config.port + " in directory " + dir);
}

function close(callback) {
    var curl = require('child_process').spawn('curl', ['http://localhost:' + config.port.toString() + '/quit', '-k']);
    curl.on('exit', callback);
}

switch(action) {
    case "start" :
        close( run );
        break;

    case "quit" :
        close();
        break;
}