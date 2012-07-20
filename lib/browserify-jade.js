var jade = require('jade');
var runtime = require.resolve('jade/lib/runtime');

module.exports = function (b) {
    var wrapper = function (b) {
        var files = b.files;
        for(var file in files) {
            if(file.substr(-5).toLowerCase() != ".jade")
                continue;
            files[file].body = "module.exports = " + jade.compile(files[file].body, { client: true });
        }
    };

    return function (b) {
        b.require(runtime, {target : 'jade'});
        b.register('pre', wrapper);
    };
};