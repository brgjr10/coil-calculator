const { test, expect, _electron: electron } = require('@playwright/test');

test.describe('Coil Calculator E2E', () => {
    test.describe.configure({ mode: 'serial' });

    let app;
    let win;

    test.beforeAll(async () => {
        app = await electron.launch({ args: ['.'], env: { NODE_ENV: 'test' } });
        win = await app.firstWindow();
    });

    test.afterAll(async () => {
        await app.close();
    });

    test.beforeEach(async () => {
        await win.reload();
        await win.waitForTimeout(100);
    });

    test('shows the main window and default controls', async () => {
        await expect(win).toHaveTitle(/Coil Calculator/);
        await expect(win.locator('#cc-wrap')).toBeVisible();
        await expect(win.locator('#cc-wire')).toHaveValue('28');
        await expect(win.locator('#cc-idia')).toHaveValue('2.0');
        await expect(win.locator('#cc-power')).toHaveValue('14');
    });

    test('updates resistivity when material changes', async () => {
        await win.locator('#cc-mat').selectOption('ka1');
        await expect(win.locator('#cc-res')).toHaveValue('1.45');
    });

    test('updates coil outputs when wire gauge changes', async () => {
        const resistance = win.locator('#cc-out-res');

        const initialResistance = parseFloat(await resistance.textContent());
        await win.locator('#cc-wire').fill('26');
        await win.locator('#cc-wire').dispatchEvent('input');
        await win.waitForTimeout(100);

        const newResistance = parseFloat(await resistance.textContent());
        expect(newResistance).toBeLessThan(initialResistance);
    });

    test('updates heat flux and temperature when power changes', async () => {
        const flux = win.locator('#cc-out-flux');
        const peak = win.locator('#cc-out-peak');

        const initialFlux = parseFloat(await flux.textContent());
        const initialPeak = parseFloat(await peak.textContent());

        await win.locator('#cc-power').fill('30');
        await win.locator('#cc-power').dispatchEvent('input');
        await win.waitForTimeout(100);

        expect(parseFloat(await flux.textContent())).toBeGreaterThan(initialFlux);
        expect(parseFloat(await peak.textContent())).toBeGreaterThan(initialPeak);
    });

    test('renders vape-time and wattage-range strings in expected format', async () => {
        await expect(win.locator('#cc-out-rec-power')).toHaveText(/^\d+[–-]\d+W$/);
        await expect(win.locator('#cc-out-vape-time')).toHaveText(/^(\d+(\.\d+)?s|< 0\.1s|\d+W\+)$/);
    });
});
