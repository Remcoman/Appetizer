/**
 * User: remcokrams
 * Date: 14-08-12
 * Time: 11:03
 */

/**
 * This plugin allows you to require json files
 * @return {Function}
 */
module.exports = function () {
    return function (b) {
        b.register('.json', function (body, file) {
            var jsonStruct;
            try {
                jsonStruct = JSON.parse(body);
            }
            catch(e) {
                throw new Error("Could not parse JSON in file " + file + ", error: " + e.message);
            }
            return "module.exports = " + JSON.stringify(jsonStruct, null, '\t');
        });
    };
};