/**
 * User: remcokrams
 * Date: 23-08-12
 * Time: 09:06
 */

var fs = require('fs'),
    path = require('path');

/**
 * This is the client code. We will toString it and then add it as a standalone self executing browserify module (using addEntry)
 */
var clientJS = function () {
    if(!window.EventSource) {
        console.warn("EventSource is not supported in this browser. No live updates for you, sorry....");
        return;
    }

    var eventSource = new EventSource(document.location.protocol + "//" + document.location.host + "/events");
    eventSource.addEventListener("message", function (e) {
        if(e.data == "change") {
            document.location.reload(true);
        }
    });
};

module.exports = function (directories, srcDir) {
    if(!fs.watch || !directories || !directories.length)
        return {browserify : function () {}, express : function () {}}; //return empty handlers when not supported

    if(!Array.isArray(directories))
        directories = [directories];

    directories = directories.map(function (dir) {
        return path.resolve(srcDir, dir);
    }).filter(function (dir) {
        if(dir.indexOf(srcDir) != 0) {
            console.log("Warning " + dir + " is not in " + srcDir + " and can not be monitored!");
            return false;
        }
        return true;
    });

    var watchers = [];
    directories.forEach(function (dir) {
        if(fs.existsSync(dir) && fs.statSync(dir).isDirectory())
            watchers.push( fs.watch(dir) );
    });

    process.on('exit', function () {
       watchers.forEach(function (watcher) {
           watcher.close();
       });
    });

    return {
        browserify : function (b) {
            var clientSource = clientJS.toString().replace(/^function \(\) \{/, "").replace(/}$/, "");
            b.addEntry("reloader", {body : clientSource});
        },

        express : function (req, res, next) {
            if (req.headers.accept && req.headers.accept == 'text/event-stream' && req.url == '/events') {
                res.connection.setTimeout(0);
                res.writeHead(200, {
                    'Content-Type':'text/event-stream',
                    'Cache-Control':'no-cache',
                    'Connection':'keep-alive'
                });

                var watcherFn = function (event, filename) {
                    res.write("data:change\n\n");
                };

                var exitFn = function () {
                    res.end();
                }

                watchers.forEach(function (watcher) {
                    watcher.on('change', watcherFn);
                });

                //remove listener when request is closing
                req.on('close', function (e) {
                    watchers.forEach(function (watcher) {
                        watcher.removeListener('change', watcherFn);
                    });
                    process.removeListener('exit', exitFn);
                });

                //cancel when exit
                process.on('exit', exitFn);
            }
            else {
                next();
            }
        }
    }

};