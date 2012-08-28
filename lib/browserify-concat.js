/**
 * User: remcokrams
 * Date: 14-08-12
 * Time: 11:03
 */

var path = require('path');

/**
 *
 * Concats js files and prepends the resulting source to the bundle
 *
 * @param dependencies
 * @param srcDir
 * @return {Function}
 */
module.exports = function (dependencies, srcDir) {
    return function (b) {
        var bodies = [""];

        dependencies.forEach(function (file) {
            var body = b.readFile( path.resolve(srcDir, file) );
            bodies.push(body + "\n//@ sourceURL=" + file + "\n");
        });

        b.prepend(bodies.join("\n\n"));
    }
};