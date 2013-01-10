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
 * @param {Object} userVars vars specified in the config
 * @param {Object} extraVars default vars
 * @return {Function}
 */
module.exports = function (userVars, extraVars) {
    var vars = Object.create(extraVars || null);

    userVars = userVars || {};

    Object.keys(userVars).forEach(function (varName) {
        vars[varName] = userVars[varName];
    });

    var getVar = function (name) {
        return name in vars ? vars[name] : "";
    };

    /*
        LIBS is a special type of var which when unspecified will read its value from the APPETIZER_LIBS environmental variable OR
        from the 'project_libs' folder in the appetizer install directory
     */
    if(!("LIBS" in vars)) {
        var libPath = process.env['APPETIZER_LIBS'];
        if(typeof libPath === "undefined") {
            libPath = path.join( __dirname, '..', 'project_libs');
        }
        vars['LIBS'] = libPath;
    }

    return function (b) {
        var originalResolver = b.resolver,
            originalRequire = b.require;

        b.require = function (mfile, opts) {
            if(mfile.indexOf("$") > -1) {
                opts.target = mfile;
                originalRequire.call(this, mfile, opts);
            }
            else {
                originalRequire.call(this, mfile, opts);
            }
        }

        b.resolver = function (file, basedir) {
            if(file.indexOf("$") > -1) {
                //replace template vars this is a simple find & replace
                file = file.replace(/[\\]?\$\{([^}]+)\}/g, function (a,b) {
                    if(a.charAt(0) == "\\")
                        return a;
                    return getVar(b);
                });

                //for each path part check if its a var. If so then replace it.
                file = file.split(path.sep).map(function (part) {
                    if(part.charAt(0) == "$")
                        return getVar( part.substr(1) );
                    return part;
                }).join(path.sep);

                //normalize resolves all '..' and '.' and duplicate slashes
                file = path.normalize(file);

                return file + ".js";
            }

            return originalResolver.call(this, file, basedir);
        };
    }
};