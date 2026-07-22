const { devices, _electron: electron } = require('@playwright/test');

module.exports = {
    testDir: './tests/e2e',
    testMatch: '**/*.spec.js',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        // Electron app specific configuration
        electronPath: process.env.ELECTRON_PATH || require('electron'),
        launchOptions: {
            args: ['.'],
            env: { NODE_ENV: 'test' }
        }
    },
    projects: [
        {
            name: 'Coil Calculator (Electron)',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    // Timeouts for e2e tests
    timeout: 30000,
    expect: {
        timeout: 5000
    }
};
