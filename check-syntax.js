var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
var js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
require('vm').createScript(js);
console.log('Syntax OK');