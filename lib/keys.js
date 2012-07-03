/**
 * User: remcokrams
 * Date: 24-06-11
 * Time: 13:45
 */
var events = require('events');

var emitter = new events.EventEmitter();
emitter.emit = function (event) {
    if(event == 'q' && this.listeners(event).length == 0)
    {
        process.exit();
        events.EventEmitter.prototype.emit.call(this, 'exit');
    }
    else
    {
        events.EventEmitter.prototype.emit.apply(this, Array.prototype.slice.call(arguments));
    }
};

try {
    require('tty').setRawMode(true);
}
catch(e) {}

process.stdin.resume();
process.stdin.on('keypress', function(char, key) {
  if(key)
    emitter.emit(char);
});

module.exports = emitter;