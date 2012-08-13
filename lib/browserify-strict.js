module.exports = function () {
    return function (b) {
        b.register(function (body) {
            return "\"use strict;\"\n\n" + body;
        });
    }
};