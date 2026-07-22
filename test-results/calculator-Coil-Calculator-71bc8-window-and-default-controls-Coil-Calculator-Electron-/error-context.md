# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: calculator.spec.js >> Coil Calculator E2E >> shows the main window and default controls
- Location: tests\e2e\calculator.spec.js:23:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#cc-wrap')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#cc-wrap')

```

# Test source

```ts
  1  | const { test, expect, _electron: electron } = require('@playwright/test');
  2  | 
  3  | test.describe('Coil Calculator E2E', () => {
  4  |     test.describe.configure({ mode: 'serial' });
  5  | 
  6  |     let app;
  7  |     let win;
  8  | 
  9  |     test.beforeAll(async () => {
  10 |         app = await electron.launch({ args: ['.'], env: { NODE_ENV: 'test' } });
  11 |         win = await app.firstWindow();
  12 |     });
  13 | 
  14 |     test.afterAll(async () => {
  15 |         await app.close();
  16 |     });
  17 | 
  18 |     test.beforeEach(async () => {
  19 |         await win.reload();
  20 |         await win.waitForTimeout(100);
  21 |     });
  22 | 
  23 |     test('shows the main window and default controls', async () => {
  24 |         await expect(win).toHaveTitle(/Coil Calculator/);
> 25 |         await expect(win.locator('#cc-wrap')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  26 |         await expect(win.locator('#cc-wire')).toHaveValue('28');
  27 |         await expect(win.locator('#cc-idia')).toHaveValue('2.0');
  28 |         await expect(win.locator('#cc-power')).toHaveValue('14');
  29 |     });
  30 | 
  31 |     test('updates resistivity when material changes', async () => {
  32 |         await win.locator('#cc-mat').selectOption('ka1');
  33 |         await expect(win.locator('#cc-res')).toHaveValue('1.45');
  34 |     });
  35 | 
  36 |     test('updates coil outputs when wire gauge changes', async () => {
  37 |         const resistance = win.locator('#cc-out-res');
  38 | 
  39 |         const initialResistance = parseFloat(await resistance.textContent());
  40 |         await win.locator('#cc-wire').fill('26');
  41 |         await win.locator('#cc-wire').dispatchEvent('input');
  42 |         await win.waitForTimeout(100);
  43 | 
  44 |         const newResistance = parseFloat(await resistance.textContent());
  45 |         expect(newResistance).toBeLessThan(initialResistance);
  46 |     });
  47 | 
  48 |     test('updates heat flux and temperature when power changes', async () => {
  49 |         const flux = win.locator('#cc-out-flux');
  50 |         const peak = win.locator('#cc-out-peak');
  51 | 
  52 |         const initialFlux = parseFloat(await flux.textContent());
  53 |         const initialPeak = parseFloat(await peak.textContent());
  54 | 
  55 |         await win.locator('#cc-power').fill('30');
  56 |         await win.locator('#cc-power').dispatchEvent('input');
  57 |         await win.waitForTimeout(100);
  58 | 
  59 |         expect(parseFloat(await flux.textContent())).toBeGreaterThan(initialFlux);
  60 |         expect(parseFloat(await peak.textContent())).toBeGreaterThan(initialPeak);
  61 |     });
  62 | 
  63 |     test('renders vape-time and wattage-range strings in expected format', async () => {
  64 |         await expect(win.locator('#cc-out-rec-power')).toHaveText(/^\d+[–-]\d+W$/);
  65 |         await expect(win.locator('#cc-out-vape-time')).toHaveText(/^(\d+(\.\d+)?s|< 0\.1s|\d+W\+)$/);
  66 |     });
  67 | });
  68 | 
```