/**
 * User: remcokrams
 * Date: 14-08-12
 * Time: 11:03
 */


/**
 * All js files are prepended with the "use strict" statement (see: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Functions_and_function_scope/Strict_mode)
 * @return {Function}
 */
module.exports = function () {
    return function (b) {
        b.register(".js", function (body) {
            return "\"use strict;\"\n\n" + body;
        });
    }
};