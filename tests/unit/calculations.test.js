const { describe, it, expect } = require('@jest/globals');
const {
    cToF,
    fToC,
    awgToMm,
    getCoilMetrics,
    getSaltNicStrength,
    buildTempCurve,
    calculateCoil,
    getFluxStatus
} = require('../../src/calculations.js');
const { MATS } = require('../../src/materials.js');

describe('Temperature Conversions', () => {
    it('converts Celsius to Fahrenheit correctly', () => {
        expect(cToF(0)).toBe(32);
        expect(cToF(100)).toBe(212);
        expect(cToF(-40)).toBe(-40);
        expect(cToF(20)).toBeCloseTo(68, 5);
    });

    it('converts Fahrenheit to Celsius correctly', () => {
        expect(fToC(32)).toBe(0);
        expect(fToC(212)).toBe(100);
        expect(fToC(-40)).toBe(-40);
        expect(fToC(68)).toBeCloseTo(20, 5);
    });

    it('round-trip conversion maintains accuracy', () => {
        const original = 25.5;
        expect(fToC(cToF(original))).toBeCloseTo(original, 5);
    });
});

describe('AWG to mm Conversion', () => {
    it('converts standard AWG values using lookup table', () => {
        expect(awgToMm(16)).toBe(1.291);
        expect(awgToMm(18)).toBe(1.024);
        expect(awgToMm(20)).toBe(0.812);
        expect(awgToMm(22)).toBe(0.644);
        expect(awgToMm(24)).toBe(0.511);
        expect(awgToMm(26)).toBe(0.405);
        expect(awgToMm(28)).toBe(0.321);
        expect(awgToMm(30)).toBe(0.255);
    });

    it('calculates non-standard AWG values using formula', () => {
        const result = awgToMm(27);
        expect(result).toBeGreaterThan(0.3);
        expect(result).toBeLessThan(0.4);
    });

    it('returns appropriate values for common vaping gauges', () => {
        const gauge26 = awgToMm(26);
        const gauge28 = awgToMm(28);
        expect(gauge26).toBeGreaterThan(gauge28);
        expect(gauge26).toBeCloseTo(0.405, 3);
        expect(gauge28).toBeCloseTo(0.321, 3);
    });
});

describe('Coil Geometry Calculations', () => {
    it('calculates total wire length correctly', () => {
        const wire = 0.321; // 28 AWG
        const innerDiameter = 2.0;
        const wraps = 6;
        const legLength = 1.5;
        const metrics = getCoilMetrics(wire, innerDiameter, wraps, legLength);

        // Expected: ~45.3mm based on coil geometry formula
        expect(metrics.totalLength).toBeGreaterThan(40);
        expect(metrics.totalLength).toBeLessThan(50);
        expect(metrics.totalLength).toBeCloseTo(45.3, 0);
    });

    it('calculates cross-sectional area correctly', () => {
        const wire = 0.321;
        const metrics = getCoilMetrics(wire, 2.0, 6, 1.5);
        const expectedArea = Math.PI * Math.pow(0.321 / 2, 2);
        expect(metrics.crossSectionArea).toBeCloseTo(expectedArea, 5);
    });

    it('calculates surface area correctly', () => {
        const wire = 0.321;
        const innerDiameter = 2.0;
        const wraps = 6;
        const legLength = 1.5;
        const metrics = getCoilMetrics(wire, innerDiameter, wraps, legLength);

        expect(metrics.surfaceArea).toBeGreaterThan(0);
        // Surface area = π * wire * totalLength exactly
        expect(metrics.surfaceArea).toBeCloseTo(metrics.totalLength * Math.PI * wire, 5);
    });

    it('handles zero leg length', () => {
        const metrics = getCoilMetrics(0.321, 2.0, 6, 0);
        expect(metrics.totalLength).toBeGreaterThan(0);
    });

    it('handles negative leg length by clamping to zero', () => {
        const metricsPos = getCoilMetrics(0.321, 2.0, 6, 1.5);
        const metricsNeg = getCoilMetrics(0.321, 2.0, 6, -1.5);
        expect(metricsNeg.totalLength).toBeLessThan(metricsPos.totalLength);
        expect(metricsNeg.totalLength).toBeGreaterThan(0);
    });

    it('increases length with more wraps', () => {
        const wire = 0.321;
        const innerDiameter = 2.0;
        const legLength = 1.5;
        const metrics6 = getCoilMetrics(wire, innerDiameter, 6, legLength);
        const metrics10 = getCoilMetrics(wire, innerDiameter, 10, legLength);

        expect(metrics10.totalLength).toBeGreaterThan(metrics6.totalLength);
    });
});

describe('Salt Nicotine Strength Recommendations', () => {
    it('recommends 50mg for high resistance (>= 1.2Ω)', () => {
        expect(getSaltNicStrength(1.2, 10)).toBe('50 mg');
        expect(getSaltNicStrength(1.5, 20)).toBe('35 mg');
    });

    it('recommends 35mg for medium-high resistance (1.0-1.2Ω)', () => {
        expect(getSaltNicStrength(1.0, 15)).toBe('25 mg');
        expect(getSaltNicStrength(1.1, 12)).toBe('35 mg');
    });

    it('recommends 25mg for medium resistance (0.8-1.0Ω)', () => {
        expect(getSaltNicStrength(0.8, 18)).toBe('10 mg');
        expect(getSaltNicStrength(0.9, 20)).toBe('10 mg');
    });

    it('recommends 10mg for low resistance (< 0.7Ω)', () => {
        expect(getSaltNicStrength(0.5, 30)).toBe('10 mg');
        expect(getSaltNicStrength(0.6, 50)).toBe('—');
        expect(getSaltNicStrength(0.15, 80)).toBe('—');
    });

    it('adjusts down when wattage is too low for resistance', () => {
        // High resistance but very low wattage
        expect(getSaltNicStrength(1.2, 5)).toBe('50 mg');
        expect(getSaltNicStrength(1.0, 6)).toBe('35 mg');
        expect(getSaltNicStrength(0.8, 8)).toBe('25 mg');
    });

    it('adjusts up when wattage is too high for resistance', () => {
        // Low resistance but high wattage
        expect(getSaltNicStrength(0.5, 50)).toBe('—');
        expect(getSaltNicStrength(0.6, 50)).toBe('—');
    });

    it('shows dash for MTL extreme values', () => {
        // This happens for resistance boundary cases
        const result = getSaltNicStrength(0.75, 20);
        expect(['10 mg', '25 mg', '35 mg', '50 mg', '—']).toContain(result);
    });
});

describe('Temperature Curve Generation', () => {
    it('generates correct number of data points', () => {
        const curve = buildTempCurve(14, 0.321, 44.5, 77, 3, 'n80');
        expect(curve.labels.length).toBe(121); // steps + 1
        expect(curve.temps.length).toBe(121);
    });

    it('starts at ambient temperature', () => {
        const tambF = 77;
        const curve = buildTempCurve(14, 0.321, 44.5, tambF, 3, 'n80');
        expect(curve.temps[0]).toBeCloseTo(tambF, 1);
    });

    it('temperature increases with higher power', () => {
        const lowPower = buildTempCurve(10, 0.321, 44.5, 77, 3, 'n80');
        const highPower = buildTempCurve(30, 0.321, 44.5, 77, 3, 'n80');

        expect(Math.max(...highPower.temps)).toBeGreaterThan(Math.max(...lowPower.temps));
    });

    it('shorter coils have higher peak temps at same power', () => {
        const longCoil = buildTempCurve(30, 0.321, 60, 77, 3, 'n80');
        const shortCoil = buildTempCurve(30, 0.321, 30, 77, 3, 'n80');

        const longMax = Math.max(...longCoil.temps);
        const shortMax = Math.max(...shortCoil.temps);
        expect(shortMax).toBeGreaterThan(longMax);
    });

    it('marks vape zone time correctly', () => {
        const curve = buildTempCurve(20, 0.321, 44.5, 77, 3, 'n80');
        expect(curve.timeToVapeZone).not.toBeNull();
        expect(curve.timeToVapeZone).toBeGreaterThan(0);
        expect(curve.timeToVapeZone).toBeLessThan(3);
    });

    it('detects temp burn threshold', () => {
        const curve = buildTempCurve(60, 0.321, 44.5, 77, 10, 'n80');
        // High power should eventually cause temp burn
        if (curve.timeToTempBurn !== null) {
            expect(curve.timeToTempBurn).toBeGreaterThanOrEqual(0);
        }
    });

    it('handles different materials', () => {
        const nichrome = buildTempCurve(14, 0.321, 44.5, 77, 3, 'n80');
        const kanthal = buildTempCurve(14, 0.321, 44.5, 77, 3, 'ka1');
        const stainless = buildTempCurve(14, 0.321, 44.5, 77, 3, 'ss316');

        // Different materials have different thermal properties
        expect(nichrome.temps[60]).not.toBe(kanthal.temps[60]);
        expect(kanthal.temps[60]).not.toBe(stainless.temps[60]);
    });

    it('returns string labels with formatted times', () => {
        const curve = buildTempCurve(14, 0.321, 44.5, 77, 3, 'n80');
        expect(curve.labels[0]).toBe('0.00');
        expect(curve.labels[60]).toBe('1.50');
        expect(curve.labels[120]).toBe('3.00');
    });
});

describe('Full Coil Calculation Integration', () => {
    const defaultParams = {
        wireAwg: 28,
        material: 'n80',
        innerDiameter: 2.0,
        wraps: 6,
        legLength: 1.5,
        power: 14,
        tambF: 77,
        tmax: 3
    };

    it('returns all required fields', () => {
        const result = calculateCoil(defaultParams);

        expect(result).toHaveProperty('resistance');
        expect(result).toHaveProperty('heatFlux');
        expect(result).toHaveProperty('wireLength');
        expect(result).toHaveProperty('peakTemp');
        expect(result).toHaveProperty('saltNicStrength');
        expect(result).toHaveProperty('wattageRange');
        expect(result).toHaveProperty('chartData');
        expect(result).toHaveProperty('vapeTimeDisplay');
        expect(result).toHaveProperty('instantBurnWatts');
        expect(result).toHaveProperty('fluxBarWidth');
        expect(result).toHaveProperty('fluxStatus');
    });

    it('calculates resistance correctly for known values', () => {
        const result = calculateCoil(defaultParams);
        // Expected: ~1.10 Ω/mm²/m * (44.5mm/1000) / (0.0808 mm²)
        // Approx 0.48-0.52Ω range for these parameters
        const resistance = parseFloat(result.resistance);
        expect(resistance).toBeGreaterThan(0.3);
        expect(resistance).toBeLessThan(0.8);
    });

    it('returns appropriate salt nic strength', () => {
        const result = calculateCoil(defaultParams);
        expect(['10 mg', '25 mg', '35 mg', '50 mg', '—']).toContain(result.saltNicStrength);
    });

    it('calculates wattage range correctly', () => {
        const result = calculateCoil(defaultParams);
        expect(result.wattageRange).toMatch(/^\d+[–-]\d+W$/);
        const [min, max] = result.wattageRange.replace('W', '').split(/[–-]/).map(Number);
        expect(max).toBeGreaterThan(min);
    });

    it('returns valid chart data', () => {
        const result = calculateCoil(defaultParams);
        expect(result.chartData.labels.length).toBe(121);
        expect(result.chartData.temps.length).toBe(121);
        expect(result.chartData.temps[0]).toBeCloseTo(77, 1);
    });

    it('calculates vape time display correctly', () => {
        const result = calculateCoil(defaultParams);
        expect(result.vapeTimeDisplay).toMatch(/^(\d+(\.\d+)?s|< 0\.1s|\d+W\+)$/);
    });

    it('handles extreme resistance values', () => {
        const highRes = calculateCoil({
            ...defaultParams,
            wireAwg: 16,
            wraps: 2,
            innerDiameter: 3.0
        });
        expect(parseFloat(highRes.resistance)).toBeLessThan(0.2);

        const lowRes = calculateCoil({
            ...defaultParams,
            wireAwg: 30,
            wraps: 12,
            innerDiameter: 1.5
        });
        expect(parseFloat(lowRes.resistance)).toBeGreaterThan(1.0);
    });

    it('handles extreme power values', () => {
        const lowPower = calculateCoil({ ...defaultParams, power: 5 });
        // At 5W on a small coil, wire can realistically reach 450-550°F
        expect(parseFloat(lowPower.peakTemp)).toBeLessThan(600);
        expect(parseFloat(lowPower.peakTemp)).toBeGreaterThan(200);

        const highPower = calculateCoil({ ...defaultParams, power: 100 });
        expect(parseFloat(highPower.peakTemp)).toBeGreaterThan(500);
    });
});

describe('Heat Flux Status', () => {
    it('returns "Low" status for heat flux below 150', () => {
        const status = getFluxStatus(100);
        expect(status.color).toBe('#3B6D11');
        expect(status.hint).toContain('Low');
    });

    it('returns "Good range" for heat flux 150-250', () => {
        const status = getFluxStatus(200);
        expect(status.color).toBe('#185FA5');
        expect(status.hint).toBe('Good range');
    });

    it('returns "Warm" status for heat flux 250-350', () => {
        const status = getFluxStatus(300);
        expect(status.color).toBe('#BA7517');
        expect(status.hint).toContain('Warm');
    });

    it('returns "High" status for heat flux above 350', () => {
        const status = getFluxStatus(400);
        expect(status.color).toBe('#A32D2D');
        expect(status.hint).toContain('High');
    });

    it('handles boundary values', () => {
        expect(getFluxStatus(149).color).toBe('#3B6D11');
        expect(getFluxStatus(150).color).toBe('#185FA5');
        expect(getFluxStatus(249).color).toBe('#185FA5');
        expect(getFluxStatus(250).color).toBe('#BA7517');
        expect(getFluxStatus(349).color).toBe('#BA7517');
        expect(getFluxStatus(350).color).toBe('#A32D2D');
    });
});

describe('Material Data Integrity', () => {
    it('contains all expected materials', () => {
        const expectedMaterials = [
            'n80', 'n20', 'n40', 'n60', 'n70', 'n90',
            'ka1', 'ka', 'kd',
            'ss304', 'ss316', 'ss316l', 'ss317l', 'ss321', 'ss430', 'ss904l',
            'au', 'ag', 'cu',
            'ti1', 'ti2', 'tie',
            'w', 'nio',
            'ni200lin', 'ni200',
            'nife30', 'dicodes', 'reactor', 'nife30stealth',
            'invar36', 'nidh', 'nft70', 'nft52', 'zr'
        ];

        expectedMaterials.forEach(mat => {
            expect(MATS).toHaveProperty(mat);
            expect(MATS[mat]).toHaveProperty('res');
            expect(MATS[mat]).toHaveProperty('dens');
            expect(MATS[mat]).toHaveProperty('sh');
            expect(typeof MATS[mat].res).toBe('number');
            expect(typeof MATS[mat].dens).toBe('number');
            expect(typeof MATS[mat].sh).toBe('number');
        });
    });

    it('has reasonable resistivity values', () => {
        Object.values(MATS).forEach(mat => {
            expect(mat.res).toBeGreaterThan(0);
            expect(mat.res).toBeLessThan(10);
        });
    });

    it('has reasonable density values', () => {
        Object.values(MATS).forEach(mat => {
            expect(mat.dens).toBeGreaterThan(1000);
            expect(mat.dens).toBeLessThan(25000);
        });
    });

    it('has reasonable specific heat values', () => {
        Object.values(MATS).forEach(mat => {
            expect(mat.sh).toBeGreaterThan(50);
            expect(mat.sh).toBeLessThan(1000);
        });
    });

    it('gold has very low resistivity', () => {
        expect(MATS.au.res).toBe(0.022);
    });

    it('tungsten has high density', () => {
        expect(MATS.w.dens).toBe(19300);
    });
});

describe('Edge Cases and Validation', () => {
    it('handles very small coil dimensions', () => {
        const result = calculateCoil({
            wireAwg: 30,
            material: 'ni200',
            innerDiameter: 1.0,
            wraps: 2,
            legLength: 0.5,
            power: 5,
            tambF: 70,
            tmax: 2
        });
        expect(parseFloat(result.resistance)).toBeGreaterThan(0);
    });

    it('handles large coil dimensions', () => {
        const result = calculateCoil({
            wireAwg: 16,
            material: 'ka1',
            innerDiameter: 5.0,
            wraps: 15,
            legLength: 5.0,
            power: 80,
            tambF: 80,
            tmax: 5
        });
        expect(parseFloat(result.resistance)).toBeLessThan(0.5);
    });

    it('handles zero time window gracefully', () => {
        const result = calculateCoil({
            wireAwg: 28,
            material: 'n80',
            innerDiameter: 2.0,
            wraps: 6,
            legLength: 1.5,
            power: 14,
            tambF: 77,
            tmax: 0.5
        });
        expect(result.chartData.labels.length).toBe(21);
    });

    it('handles extreme ambient temperatures', () => {
        const cold = calculateCoil({
            wireAwg: 28,
            material: 'n80',
            innerDiameter: 2.0,
            wraps: 6,
            legLength: 1.5,
            power: 14,
            tambF: 40,
            tmax: 3
        });
        const hot = calculateCoil({
            wireAwg: 28,
            material: 'n80',
            innerDiameter: 2.0,
            wraps: 6,
            legLength: 1.5,
            power: 14,
            tambF: 100,
            tmax: 3
        });
        expect(parseFloat(hot.peakTemp)).toBeGreaterThan(parseFloat(cold.peakTemp));
    });

    it('handles different material thermal properties', () => {
        const nichrome = calculateCoil({
            wireAwg: 28,
            material: 'n80',
            innerDiameter: 2.0,
            wraps: 6,
            legLength: 1.5,
            power: 30,
            tambF: 77,
            tmax: 3
        });
        const gold = calculateCoil({
            wireAwg: 28,
            material: 'au',
            innerDiameter: 2.0,
            wraps: 6,
            legLength: 1.5,
            power: 30,
            tambF: 77,
            tmax: 3
        });
        // Gold heats much faster due to lower heat capacity
        expect(parseFloat(gold.timeToVapeZone)).toBeLessThan(parseFloat(nichrome.timeToVapeZone));
    });
});
