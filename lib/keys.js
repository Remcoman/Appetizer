/**
 * User: remcokrams
 * Date: 24-06-11
 * Time: 13:45
 */
var events = require('events'),
    readline = require('readline');

var emitter = new events.EventEmitter();
emitter.emit = function (event) {
    if(event == 'q' && this.listeners(event).length == 0) {
        process.exit();
        events.EventEmitter.prototype.emit.call(this, 'exit');
    }
    else {
        events.EventEmitter.prototype.emit.apply(this, Array.prototype.slice.call(arguments));
    }
};

var setRawMode = process.stdin.setRawMode || require('tty').setRawMode; //from v0.8.7 setRawMode has been moved to process.stdin
try {
    setRawMode(true);
}
catch(e) {}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.input.on('keypress', function(char, key) {
    if(key)
        emitter.emit(char);
});

module.exports = emitter;