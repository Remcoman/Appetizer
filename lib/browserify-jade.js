var jade = require('jade');
var runtime = require.resolve('jade/lib/runtime');

var runtimeBody = function (locals) {
    return compiledTemplate(locals, jade.attrs, jade.escape, jade.rethrow, jade.merge);
};

module.exports = function () {

    var wrapper = function (b) {
        for(var file in b.files) {
            if(file.substr(-5).toLowerCase() != ".jade")
                continue;
            var src = [
                "var compiledTemplate = " + jade.compile(b.files[file].body, { client: true }).toString() + ";",
                "var jade = require('jade/lib/runtime');",
                "module.exports = function (locals) {return compiledTemplate(locals, jade.attrs, jade.escape, jade.rethrow, jade.merge);}"
            ]
            b.files[file].body = src.join("\n");
        }
    };

    return function (b) {
        b.require(runtime, {target : 'jade/lib/runtime'});
        b.register('pre', wrapper);
    };
};