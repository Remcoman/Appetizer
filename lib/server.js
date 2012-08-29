var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    keys = require('./keys'),
    watcher = require('./watcher'),
    browserify_text = require('./browserify-text'),
    browserify_strict = require('./browserify-strict'),
    browserify_concat = require('./browserify-concat'),
    browserify_json = require('./browserify-json'),
    browserify_express_reloader = require('./browserify-express-reloader'),
    configReader = require('./configReader'),
    browserify = require('browserify'),
    http = require('http'),
    url = require('url'),
    mime = require('mime'),
    plugins = require('./plugins'),
    existsSync = fs.existsSync || path.existsSync;

var action = process.argv[2] || "start",
    projectDir = process.argv[3] || process.cwd(),
    config = configReader.read(projectDir);

function run() {
    var srcDir = path.join( projectDir, "src" );

    var app = express.createServer();

    var reloaderPlugin = browserify_express_reloader(config.reloaderpaths, srcDir);

    app.configure(function () {
        app.use(reloaderPlugin.express);
        app.use(app.router);
        app.use(express.static(srcDir));
    });

    var mainPath,
        redefineMainPath = function () {
            mainPath = path.join("/", config.main);
        };
    redefineMainPath();


    /**
     * Handle the main browserify entry
     * @param req
     * @param res
     * @return {Boolean} true if the path matches the main path. Otherwise false
     */
    var handleMain = function (req, res) {
        if(req.params[0] !== mainPath)
            return false;

        var inFile = path.join(srcDir, mainPath),
            pluginProps = plugins.getMatch(inFile);

        var js, error;
        try {
            var b = browserify({cache : false, prelude : false, debug : true});

            b.on('syntaxError', function (e) {
                error = e;
            });

            b.use( browserify_concat(config.dependencies, srcDir) );
            b.use( browserify_text([".xml", ".css", ".html", ".txt"]) );
            b.use( plugins.browserify() );
            b.use( browserify_json() );
            b.use( browserify_strict() );
            b.use( reloaderPlugin.browserify );

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

        return true;
    }


    /**
     * Handle the proxies
     * @param req
     * @param res
     * @return {Boolean} true if there is a matched proxy. Otherwise false
     */
    var handleProxy = function (req, res) {
        if(!config.proxies)
            return false;

        //get the last proxy that was matched
        var matchedProxy = Object.keys(config.proxies).filter(function (proxy) {
            proxy = proxy.charAt(0) == "/" ? proxy : "/" + proxy;
            return req.params[0].indexOf(proxy) == 0;
        }).pop();

        if(!matchedProxy)
            return false;

        var match = req.params[0].match(new RegExp("^/" + matchedProxy + "(/.*)?")),
            redirect = config.proxies[matchedProxy].replace(/\/$/, "");

        //parse the redirect url + the optional remaing path. We also keep the method and headers of the original event
        var options = url.parse(redirect + (match[1] || ""));
        options.headers = req.headers;
        options.method = req.method;

        var proxyReq = http.request(options, function (proxyRes) {
            proxyRes.setEncoding('utf8');
            proxyRes.on('data', function (data) {
                res.send(data);
            });
        }).on('error', function (e) {
            res.send(JSON.stringify({error : e.message}));
        });

        req.on('data', function (chunk) {
            proxyReq.write(chunk);
        });

        proxyReq.end();

        return true;
    }


    /**
     * We catch all get requests
     * We Browserify the main file if the request url matches the mainPath
     * The reason that we don't create a seperate route for the mainPath is that it can change dynamicly when the server is running
     */
    app.get('*', function (req, res, next) {
        var handledPaths = [handleMain, handleProxy].some(function (fn) {
             return fn(req, res);
        });

        if(!handledPaths)
            next(); //no match? next route
    });


    /*
    Create a route for each plugin
    */
    plugins.each(function (pluginMod) {
        //create a regex with matches the plugin extension
        var matchRequest = new RegExp("(.+\." + pluginMod.extension.substr(1) + "\." + pluginMod.type + "$)", "i");

        app.get(matchRequest, function (req, res, next) {
            var inputFile = path.join(srcDir, req.params[0].replace(/\.\w+$/i, "") );

            if(!existsSync(inputFile))
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

    if(existsSync( path.join(projectDir, "config.json") )) {
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

    var close = function (req, res) {
        if(res) {
            res.end("Shutting down. Good bye!");
        }
        else {
            console.log("Shutting down. Good bye!");
        }

        app.close();

        if(configMonitor)
            configMonitor.close();

        process.exit(0);
    };

    /*
        Define actions that will shutdown the server
    */
    app.get(/\/(quit|shutdown|close|exit|kill)$/, close);
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