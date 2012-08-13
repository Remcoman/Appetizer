var jade = require('jade');
var runtime = require.resolve('jade/lib/runtime');

module.exports = function (b) {
    var wrapper = function (body) {
        var src = [
            "var jade = require('jade/lib/runtime'),",
            "    compiledTemplate = " + jade.compile(body, { client: true }).toString() + ";",
            "module.exports = function (locals) {return compiledTemplate(locals);}"
        ];
        return src.join("\n");
    };

    return function (b) {
        b.require(runtime, {target : 'jade/lib/runtime'});
        b.register('.jade', wrapper);
    };
};