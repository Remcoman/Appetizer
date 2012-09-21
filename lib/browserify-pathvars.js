/**
 * User: remcokrams
 * Date: 20-09-12
 * Time: 09:37
 */

var path = require('path');

/**
 *
 * This plugin allows you to add template variables to your require paths.
 * There are 2 types of variables:
 *
 * require('$LIBS/bla'); <-- path vars are shorter but must be enclosed by slashes
 *
 * or
 *
 * require('bla_${ENV}'); <-- template vars can be used everywhere in a path
 *
 * @param {Array} vars
 * @return {Function}
 */
module.exports = function (vars) {
    vars = vars || {};

    var getVar = function (name) {
        return name in vars ? vars[name] : "";
    };

    return function (b) {
        b.register('path', function (p) {

            //replace template vars this is a simple find & replace
            p = p.replace(/[\\]?\$\{([^}]+)\}/g, function (a,b) {
                if(a.charAt(0) == "\\")
                    return a;
                return getVar(b);
            });

            //for each path part check if its a var. If so then replace it.
            p = p.split(path.sep).map(function (part) {
                if(part.charAt(0) == "$")
                    return getVar( part.substr(1) );
                return part;
            }).join(path.sep);

            //normalize resolves all '..' and '.' and duplicate slashes
            p = path.normalize(p);

            return p;
        });
    }
};