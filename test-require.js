const electron = require('electron');
console.log('Type:', typeof electron);
console.log('Is object?', electron && typeof electron === 'object');
console.log('Keys:', Object.keys(electron));
console.log('Has app?', 'app' in electron);
console.log('Has BrowserWindow?', 'BrowserWindow' in electron);
if (electron.app) console.log('app exists');
else console.log('app missing');
