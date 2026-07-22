const electron = require('electron');
console.log('Electron module full:', electron);
console.log('Electron module type:', typeof electron);
console.log('Electron module keys:', Object.keys(electron));
console.log('Electron module toString:', electron.toString());

const { app, BrowserWindow } = electron;
console.log('app:', app);
console.log('BrowserWindow:', BrowserWindow);
