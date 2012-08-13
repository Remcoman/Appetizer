var fs = require('fs'),
    EventEmitter = require('events').EventEmitter;

exports.create = function (file) {
    var watcher = Object.create(EventEmitter.prototype);

    if("watch" in fs) {
        //TODO test the new watch api
        watcher.fsWatcher = fs.watch(file, function () {
           watcher.emit('change');
        });
        watcher.close = watcher.fsWatcher.close.bind(watcher.fsWatcher);
    }
    else {
        fs.watchFile(file, function (curr, prev) {
            if(curr.mtime > prev.mtime)
                watcher.emit('change');
        });
        watcher.close = function () {
            fs.unwatchFile(file);
        }
    }

    return watcher;
}