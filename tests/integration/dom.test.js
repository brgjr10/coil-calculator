const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.join(
    __dirname,
    '..',
    '..',
    'node_modules',
    'jest-environment-jsdom',
    'node_modules',
    'jsdom',
    'lib',
    'api.js'
));
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

describe('Coil Calculator DOM Integration', () => {
    let dom;
    let window;
    let document;

    beforeEach(async () => {
        const htmlPath = path.join(__dirname, '..', '..', 'index.html');
        const html = fs.readFileSync(htmlPath, 'utf-8')
            .replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/Chart\.js\/4\.4\.1\/chart\.umd\.js"><\/script>/, '');

        dom = new JSDOM(html, {
            runScripts: 'dangerously',
            resources: 'usable',
            pretendToBeVisual: true,
            url: 'http://localhost',
            beforeParse(win) {
                win.require = (specifier) => {
                    if (specifier === './src/calculations.js') {
                        return require(path.join(__dirname, '..', '..', 'src', 'calculations.js'));
                    }
                    if (specifier === './src/materials.js') {
                        return require(path.join(__dirname, '..', '..', 'src', 'materials.js'));
                    }
                    return require(specifier);
                };
                win.Chart = function ChartMock() {
                    return {
                        data: { labels: [], datasets: [{ data: [] }] },
                        options: { scales: { y: {} } },
                        update() {}
                    };
                };
            }
        });

        window = dom.window;
        document = window.document;

        const dynamicChartScript = Array.from(document.querySelectorAll('script'))
            .find((script) => script.src && script.src.includes('chart.umd.js'));
        if (dynamicChartScript) {
            dynamicChartScript.dispatchEvent(new window.Event('load'));
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
    });

    afterEach(() => {
        dom.window.close();
    });

    it('renders the app shell and primary controls', () => {
        expect(document.getElementById('cc-wrap')).not.toBeNull();
        expect(document.getElementById('cc-sidebar')).not.toBeNull();
        expect(document.getElementById('cc-main')).not.toBeNull();
        expect(document.getElementById('cc-mat')).not.toBeNull();
        expect(document.getElementById('cc-wire').value).toBe('28');
        expect(document.getElementById('cc-idia').value).toBe('2.0');
        expect(document.getElementById('cc-power').value).toBe('14');
    });

    it('keeps material resistivity tied to the selected alloy', async () => {
        const matSelect = document.getElementById('cc-mat');
        const resInput = document.getElementById('cc-res');

        expect(resInput.value).toBe('1.10');

        matSelect.value = 'ka1';
        matSelect.dispatchEvent(new window.Event('change'));
        await new Promise((resolve) => setTimeout(resolve, 25));

        expect(resInput.value).toBe('1.45');
    });

    it('updates displayed coil resistance when wire gauge changes', async () => {
        const wireInput = document.getElementById('cc-wire');
        const resistanceEl = document.getElementById('cc-out-res');

        const initialResistance = parseFloat(resistanceEl.textContent);
        wireInput.value = '26';
        wireInput.dispatchEvent(new window.Event('input'));
        await new Promise((resolve) => setTimeout(resolve, 25));

        const newResistance = parseFloat(resistanceEl.textContent);
        expect(newResistance).toBeLessThan(initialResistance);
    });

    it('updates heat flux and peak temperature when power changes', async () => {
        const powerInput = document.getElementById('cc-power');
        const fluxEl = document.getElementById('cc-out-flux');
        const peakEl = document.getElementById('cc-out-peak');

        const initialFlux = parseFloat(fluxEl.textContent);
        const initialPeak = parseFloat(peakEl.textContent);

        powerInput.value = '30';
        powerInput.dispatchEvent(new window.Event('input'));
        await new Promise((resolve) => setTimeout(resolve, 25));

        expect(parseFloat(fluxEl.textContent)).toBeGreaterThan(initialFlux);
        expect(parseFloat(peakEl.textContent)).toBeGreaterThan(initialPeak);
    });

    it('renders the coil svg and chart globals after calculation', () => {
        const svg = document.getElementById('cc-coil-svg');
        expect(svg.innerHTML.length).toBeGreaterThan(0);
        expect(window.ccLabels.length).toBeGreaterThan(0);
        expect(window.ccCurrentPower).toBe(14);
    });

    it('shows a wattage range and vape time in user-facing format', () => {
        expect(document.getElementById('cc-out-rec-power').textContent).toMatch(/^\d+[–-]\d+W$/);
        expect(document.getElementById('cc-out-vape-time').textContent).toMatch(/^(\d+(\.\d+)?s|< 0\.1s|\d+W\+)$/);
    });

    it('stores burn time data for chart burn lines', () => {
        expect(window.ccTempBurnTime).toBeDefined();
        expect(window.ccFluxBurnTime).toBeDefined();
        expect(window.ccInstantBurnWatts).toBeDefined();
        expect(window.ccInstantBurnWatts).toBeDefined();
    });

    it('stores chart data with temperature burn thresholds', () => {
        expect(window.ccLabels.length).toBeGreaterThan(0);
        const maxTime = parseFloat(window.ccLabels[window.ccLabels.length - 1]);
        
        const tempBurnIdx = window.ccTempBurnTime !== null && window.ccTempBurnTime !== undefined
            ? window.ccLabels.findIndex(l => parseFloat(l) >= window.ccTempBurnTime)
            : -1;
        
        const tempVisible = tempBurnIdx >= 0 && tempBurnIdx < window.ccLabels.length;
        
        expect(tempVisible).toBe(true);
    });

    it('uses correct burn time variables for chart lines', () => {
        expect(window.ccFluxBurnTime).toBeDefined();
        expect(window.ccTempBurnTime).toBeDefined();
        const maxTime = parseFloat(window.ccLabels[window.ccLabels.length - 1]);
        expect(window.ccFluxBurnTime).toBeLessThanOrEqual(maxTime);
        expect(window.ccTempBurnTime).toBeLessThanOrEqual(maxTime);
    });

    it('calculates heat-up time from ambient to vape zone', () => {
        const timeEl = document.getElementById('cc-out-vape-time');
        const time = timeEl.textContent;
        
        expect(time).toMatch(/^(\d+(\.\d+)?s|< 0\.1s|\d+W\+)$/);
        
        if (time !== 'W+' && !time.startsWith('<')) {
            const numericValue = parseFloat(time);
            expect(numericValue).toBeGreaterThan(0);
            expect(numericValue).toBeLessThanOrEqual(60);
        }
    });

    it('stores heat-up time for chart display', () => {
        expect(window.ccTimeToVapeZone).toBeDefined();
    });
});
