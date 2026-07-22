// Jest setup file
// This runs before each test file

// Mock window and document for jsdom environment
global.window = undefined;
global.document = undefined;

// Silence console in tests if desired
// global.console = {
//   log: () => {},
//   debug: () => {},
//   info: () => {},
//   warn: () => {},
//   error: () => {}
// };
