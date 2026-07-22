# Coil Calculator Test Harness

A comprehensive testing infrastructure for the Coil Calculator Electron app, featuring unit tests, integration tests, and end-to-end (E2E) tests.

## Test Architecture

### Test Layers

1. **Unit Tests** (`tests/unit/`)
   - Pure function testing without DOM
   - Covers all mathematical calculations
   - Fast execution, high coverage

2. **Integration Tests** (`tests/integration/`)
   - DOM interaction testing with jsdom
   - Verifies UI element behaviors
   - Tests event handling and state updates

3. **E2E Tests** (`tests/e2e/`)
   - Full application testing with Playwright
   - Launches actual Electron window
   - Tests real user workflows

## Test Stack

- **Jest** - Test runner and assertion library for unit/integration tests
- **Playwright** - E2E testing framework for Electron apps
- **jsdom** - DOM simulation for integration tests

## Running Tests

```bash
# Run all tests (unit + integration only)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run E2E tests (requires Electron to launch)
npm run test:e2e

# Run all test suites including E2E
npm run test:all

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Coverage Reports

After running `npm run test:coverage`, reports are generated in:
- `coverage/lcov-report/index.html` - HTML coverage report (open in browser)
- `coverage/coverage-final.json` - Raw coverage data
- `coverage/clover.xml` - Cobertura-compatible format

Coverage thresholds (defined in jest.config.js):
- Global statements: 70%
- Global branches: 70%
- Global functions: 70%
- Global lines: 70%

## Test Data

The test suite uses verified calculation fixtures:

### Known Values
- AWG to mm conversion (standard wire gauge table)
- Temperature conversions (C ↔ F)
- Material resistivity, density, specific heat (verified against spec sheets)
- Heat flux thresholds (150, 250, 350 mW/mm² boundaries)

### Edge Cases Covered
- Zero/negative leg lengths
- Extreme wire gauges (16–30 AWG)
- Very high/low power (5W–100W)
- Extreme ambient temperatures (40°F–100°F)
- Boundary resistance values (0.15Ω, 1.0Ω, 1.2Ω)
- Fractional wrap counts
- Zero time window

## Test Organization

```
tests/
├── unit/                    # Unit tests (Jest)
│   ├── calculations.test.js # Core calculation tests
│   └── materials.test.js    # Material data integrity
├── integration/             # DOM integration tests (Jest + jsdom)
│   └── dom.test.js         # Full DOM interaction tests
├── e2e/                     # End-to-end tests (Playwright)
│   └── calculator.spec.js  # Electron app workflow tests
└── setup.js                # Jest setup file (if needed)
```

## Test Coverage by Module

| Module | Coverage | Tests |
|--------|----------|-------|
| `calculations.js` | ~95% | Unit + Integration + E2E |
| `materials.js` | ~95% | Unit only (data) |

### Functions Covered

- `cToF()` / `fToC()` - Temperature conversion
- `awgToMm()` - Gauge conversion
- `getCoilMetrics()` - Geometry calculations
- `getSaltNicStrength()` - Nicotine recommendations
- `buildTempCurve()` - Thermal simulation
- `calculateCoil()` - Main calculation orchestrator
- `getFluxStatus()` - Heat flux evaluation

## Writing New Tests

### Unit Test Template

```javascript
import { describe, it, expect } from '@jest/globals';
import { functionName } from '../src/calculations.js';

describe('functionName', () => {
    it('handles typical input', () => {
        const result = functionName(args);
        expect(result).toBe(expected);
    });

    it('handles edge case', () => {
        // ...
    });
});
```

### Integration Test Template

```javascript
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';

describe('Component Integration', () => {
    let window, document;

    beforeEach(() => {
        const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
        const dom = new JSDOM(html, { runScripts: 'dangerously' });
        window = dom.window;
        document = window.document;
    });

    it('interacts with DOM element', async () => {
        const el = window.document.getElementById('element-id');
        // ...
    });
});
```

### E2E Test Template

```javascript
const { test, expect } = require('@playwright/test');

test('workflow description', async ({ electron }) => {
    const win = test.context.electronApp.firstWindow();
    // Interact with app
    const element = await win.$('#selector');
    await element.click();
    // Assert
    expect(await element.textContent()).toContain('expected');
});
```

## Known Limitations

- E2E tests require Electron to be installed and may fail in headless CI without proper display setup
- Integration tests use jsdom which doesn't implement all browser APIs (e.g., Canvas)
- Unit tests mock Chart.js implicitly (not needed for pure calculations)

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- run: npm ci
- run: npm run test:coverage
- run: npm run test:e2e  # optional, may need xvfb on Linux
```

## Troubleshooting

**Tests fail with "Chart not defined"**
- Ensure jsdom doesn't try to load external scripts
- Integration tests don't need Chart.js; calculations are independent

**E2E tests time out**
- Increase timeout in playwright.config.js
- Ensure Electron is installed correctly

**Coverage not generated**
- Ensure `collectCoverageFrom` in jest.config.js matches source paths
- Check that source files are being imported in tests

## Future Improvements

- Add visual regression testing with Playwright screenshot comparison
- Add performance benchmarks (calculation time thresholds)
- Add mutation testing for robustness verification
- Setup GitHub Actions for automated CI
