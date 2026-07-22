const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
// extract CSS string between style.textContent = ` and `;
const cssStartIdx = html.indexOf('style.textContent = `');
if (cssStartIdx === -1) { console.log('no style'); process.exit(1); }
const cssContentStart = html.indexOf('`', cssStartIdx) + 1;
const cssContentEnd = html.indexOf('`;', cssContentStart);
const css = html.slice(cssContentStart, cssContentEnd);

// Now check for .cc-panels and .cc-panel rules
const lines = css.split('\n');
let inRule = false;
let ruleName = '';
let braceCount = 0;
let errors = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (!inRule && trimmed.endsWith('{')) {
    inRule = true;
    ruleName = trimmed.replace('{', '').trim();
    braceCount = 1;
    continue;
  }
  if (inRule) {
    // count braces in this line
    for (let ch of line) {
      if (ch === '{') braceCount++;
      else if (ch === '}') braceCount--;
    }
    if (braceCount === 0) {
      inRule = false;
      // rule ends here
    }
  }
}
console.log('Checked CSS, open rules at end:', inRule ? ruleName : 'none');

// Also print specific rules
const getRule = (selector) => {
  const re = new RegExp(selector + '\\s*{([^}]*)}', 'g');
  const match = re.exec(css);
  if (match) return match[0];
  return null;
};

console.log('.cc-panels rule:', getRule('.cc-panels'));
console.log('.cc-panels-left rule:', getRule('.cc-panels-left'));
console.log('.cc-panel rule:', getRule('.cc-panel'));
console.log('.cc-panel.salt-nic rule:', getRule('.cc-panel\\.salt-nic'));
console.log('.cc-panel.coil rule:', getRule('.cc-panel\\.coil'));
console.log('.cc-panel.chart rule:', getRule('.cc-panel\\.chart'));
