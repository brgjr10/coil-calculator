var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
var m = html.match(/<script>([\s\S]*?)<\/script>/);
var script = m[1];

var lines = script.split('\n');
console.log('Total lines:', lines.length);

// check the drawCoil function area
var match = script.match(/function drawCoil/);
var pos = match.index;
var lineNum = script.substring(0, pos).split('\n').length;
console.log('drawCoil found at line:', lineNum);

// Show surrounding lines
for(var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('function drawCoil') >= 0) {
        console.log('Line', i, ':', lines[i].slice(0,80));
        console.log('Line', i+1, ':', lines[i+1] ? lines[i+1].slice(0,80) : 'undefined');
        console.log('Line', i+2, ':', lines[i+2] ? lines[i+2].slice(0,80) : 'undefined');
        break;
    }
}