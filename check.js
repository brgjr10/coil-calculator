const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
// Extract between style.textContent = ` and the closing `;
const start = html.indexOf('style.textContent = `');
if (start === -1) { console.log('no style'); process.exit(1); }
const cssStart = html.indexOf('`', start) + 1;
const cssEnd = html.indexOf('`;', cssStart);
const css = html.slice(cssStart, cssEnd);
let depth = 0;
let line = 1;
let col = 0;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '\n') { line++; col = 0; }
  else col++;
  if (css[i] === '{') depth++;
  else if (css[i] === '}') {
    depth--;
    if (depth < 0) {
      console.log(`Unmatched } at line ${line}, col ${col}`);
      process.exit(1);
    }
  }
}
if (depth > 0) {
  console.log(`Unclosed {, depth ${depth}`);
} else {
  console.log('CSS braces balanced');
}

// Also check JS braces in the main IIFE
const jsStart = html.indexOf('(function () {');
if (jsStart !== -1) {
  const jsBodyStart = jsStart + '(function () {'.length;
  // Find matching }); for the IIFE end
  // We'll just extract from jsBodyStart to the next occurrence of '})();' or similar.
  // Actually we can count braces from jsBodyStart until we find a '}' that brings depth to 0 after encountering the function body start.
  let depth2 = 1; // we already have one {
  let i = jsBodyStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth2++;
    else if (ch === '}') depth2--;
    if (depth2 === 0) break;
  }
  const js = html.slice(jsBodyStart, i);
  let jsDepth = 0;
  for (let j = 0; j < js.length; j++) {
    if (js[j] === '{') jsDepth++;
    else if (js[j] === '}') jsDepth--;
  }
  console.log('JS body brace balance:', jsDepth === 0 ? 'OK' : `UNBALANCED by ${jsDepth}`);
}
