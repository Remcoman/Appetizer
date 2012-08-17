var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    keys = require('./keys'),
    watcher = require('./watcher'),
    browserify_text = require('./browserify-text'),
    browserify_strict = require('./browserify-strict'),
    browserify_concat = require('./browserify-concat'),
    configReader = require('./configReader'),
    browserify = require('browserify'),
    mime = require('mime'),
    plugins = require('./plugins');

var action = process.argv[2] || "start",
    projectDir = process.argv[3] || process.cwd(),
    config = configReader.read(projectDir);

function run() {
    var srcDir = path.join( projectDir, "src" );

    var app = express.createServer();

    app.configure(function () {
        app.use(app.router);
        app.use(express.static(srcDir));
    });

    var mainPath,
        redefineMainPath = function () {
            mainPath = path.join("/", config.main);
        };

    redefineMainPath();

    /**
     * We catch all get requests
     * We Browserify the main file if the request url matches the mainPath
     * The reason that we don't create a seperate route for the mainPath is that it can change dynamicly when the server is running
     */
    app.get('*', function (req, res, next) {
        if(req.params[0] == mainPath) {
            var inFile = path.join(srcDir, mainPath),
                pluginProps = plugins.getMatch(inFile);

            var js, error;
            try {
                var b = browserify({cache : false, prelude : false, debug : true});

                b.on('syntaxError', function (e) {
                    error = e;
                });

                b.use( browserify_concat(config.dependencies, srcDir) );
                b.use( browserify_text([".json", ".xml", ".css", ".html", ".txt"]) );
                b.use( plugins.browserify() );
                b.use( browserify_strict() );

                if(pluginProps) {
                    b.addEntry(pluginProps.inFile);
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
                    js = "console.error(" + JSON.stringify(error.message) + ")";
                res.header("Content-Type", "application/javascript");
                res.send(js);
            });
        }
        else {
            next();
        }
    });

    /*
    Create a route for each plugin
    */
    plugins.each(function (pluginMod) {
        //create a regex with matches the plugin extension
        var matchRequest = new RegExp("(.+\." + pluginMod.extension.substr(1) + "\." + pluginMod.type + "$)", "i");

        app.get(matchRequest, function (req, res, next) {
            var inputFile = path.join(srcDir, req.params[0].replace(/\.\w+$/i, "") );

            if(!path.existsSync(inputFile))
                return next();

            res.header("Content-Type", mime.types[ pluginMod.type ] || "application/octet-stream");

            try {
                var body = fs.readFileSync(inputFile, 'utf8');

                pluginMod.server(body, inputFile, function (e, body) {
                    if(e)
                        throw e;
                    res.send(body);
                });
            }
            catch(e) {
                res.send( e.message );
            }
        });
    });

    if(path.existsSync( path.join(projectDir, "config.json") )) {
        var configMonitor = watcher.create( path.join(projectDir, "config.json") );
        configMonitor.on('change', function () {
            console.log("Config changed");

            var oldMain = config.main;

            config = configReader.read(projectDir);

            if(oldMain !== config.main) {
                redefineMainPath();
            }
        });
    }

    var close = function () {
        app.close();

        if(configMonitor)
            configMonitor.close();

        process.exit(0);
    };

    app.get('/quit', close);
    keys.on('q', close);

    app.listen(config.port);

    console.log("Server started on port " + config.port + " in directory " + srcDir);
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