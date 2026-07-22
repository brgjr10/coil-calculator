const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) {
  console.log('No style block found');
  process.exit(1);
}
const css = styleMatch[1];
let count = 0;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '{') count++;
  else if (css[i] === '}') count--;
}
console.log('CSS brace balance:', count === 0 ? 'balanced' : `unbalanced (diff ${count})`);

// Check JS brace balance in main script block
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const js = scriptMatch[1];
  let jsCount = 0;
  for (let i = 0; i < js.length; i++) {
    if (js[i] === '{') jsCount++;
    else if (js[i] === '}') jsCount--;
  }
  console.log('JS brace balance:', jsCount === 0 ? 'balanced' : `unbalanced (diff ${jsCount})`);
}
