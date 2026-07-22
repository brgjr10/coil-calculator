const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
// Extract CSS from the style.textContent assignment
const cssMatch = html.match(/style\.textContent = `([\s\S]*?)`;/);
if (!cssMatch) {
  console.log('Could not find CSS string');
  process.exit(1);
}
const css = cssMatch[1];
let balance = 0;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '{') balance++;
  else if (css[i] === '}') balance--;
}
console.log('CSS brace balance:', balance === 0 ? 'OK' : `UNBALANCED by ${balance}`);

// Extract JS from the main script (the IIFE)
const scriptMatch = html.match(/\(function \(\) {([\s\S]*?)\}\)\(\);/);
if (scriptMatch) {
  const js = scriptMatch[0]; // includes wrapper
  let jsBalance = 0;
  for (let i = 0; i < js.length; i++) {
    if (js[i] === '{') jsBalance++;
    else if (js[i] === '}') jsBalance--;
  }
  console.log('JS brace balance:', jsBalance === 0 ? 'OK' : `UNBALANCED by ${jsBalance}`);
} else {
  console.log('Could not extract JS');
}
