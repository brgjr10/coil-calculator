const { MATS } = require('./materials.js');

const HEAT_TRANSFER = {
    baseH: 25,
    emissivity: 0.7,
    evapStartC: 100,
    dryOutC: 260,
    juiceDepletionRate: 0.0005,
    TCR: 0.00017,
    wetnessFactor: 1.5,
    airflowFactor: 1.0,
    activeSurfaceFactor: 0.7,
    spacingFactor: 1.05,
    powerEfficiency: 0.65,
    rampLag: 0.85
};

function cToF(c) {
    return c * 9 / 5 + 32;
}

function fToC(f) {
    return (f - 32) * 5 / 9;
}

function awgToMm(awg) {
    const awgTable = {
        16: 1.291,
        18: 1.024,
        20: 0.812,
        22: 0.644,
        24: 0.511,
        26: 0.405,
        28: 0.321,
        30: 0.255
    };

    return awgTable[awg] || 0.127 * Math.pow(92, (36 - awg) / 39);
}

function getCoilMetrics(wire, innerDiameter, wraps, legLength) {
    // Mean diameter = inner diameter + wire diameter (center-to-center of coil)
    const meanDiameter = innerDiameter + wire;
    const turnCircumference = Math.PI * meanDiameter;
    // Pitch = wire diameter for touching wraps (most common build)
    const turnPitch = wire;
    const turnLength = Math.sqrt(turnCircumference * turnCircumference + turnPitch * turnPitch);
    const totalLength = turnLength * wraps + Math.max(legLength, 0);
    const crossSectionArea = Math.PI * Math.pow(wire / 2, 2);
    const surfaceArea = Math.PI * wire * totalLength;
    const coilWidth = wraps * turnPitch;
    return { totalLength, crossSectionArea, surfaceArea, coilWidth, turnPitch };
}


function getHeatTransferCoefficient(tempC, tambC, juiceLevel = 1, power = 0) {
    let h = HEAT_TRANSFER.baseH + 0.15 * (tempC - tambC);

    if (tempC > HEAT_TRANSFER.evapStartC) {
        h *= HEAT_TRANSFER.wetnessFactor * juiceLevel;
    }

    h *= HEAT_TRANSFER.airflowFactor;
    h = Math.max(h, HEAT_TRANSFER.baseH);

    return h;
}

function getRadiativeLoss(tempC, tambC, surfaceAreaMm2) {
    const tempK = tempC + 273.15;
    const ambK = tambC + 273.15;
    const surfaceAreaM2 = surfaceAreaMm2 / 1000000;

    return HEAT_TRANSFER.emissivity * 5.670374419e-8 * surfaceAreaM2 *
        (Math.pow(tempK, 4) - Math.pow(ambK, 4));
}

function getHeatLossAtTemp(tempC, tambC, surfaceAreaMm2, juiceLevel = 1, power = 0) {
    const deltaC = Math.max(tempC - tambC, 0);
    const h = getHeatTransferCoefficient(tempC, tambC, juiceLevel, power);
    const effectiveSurface = surfaceAreaMm2 * HEAT_TRANSFER.activeSurfaceFactor;
    const convectiveLoss = h * (effectiveSurface / 1000000) * deltaC;

    return convectiveLoss + getRadiativeLoss(tempC, tambC, surfaceAreaMm2);
}

function getSaltNicStrength(resistance, wattage) {
    const wR = wattage / resistance;
    
    if (resistance < 0.7 && wattage >= 50) return '—';
    if (resistance < 0.7 && wR >= 80) return '—';
    
    if (resistance >= 1.0) {
        if (wR <= 5) return '50 mg';
        if (wR <= 7) return '35 mg';
        if (wR <= 9) return '50 mg';
        if (wR <= 14) return '35 mg';
        if (wR <= 16) return '25 mg';
        return '35 mg';
    } else if (resistance >= 0.8) {
        if (wR <= 12) return '25 mg';
        if (wR > 20) return '10 mg';
        return '20 mg';
    } else if (resistance >= 0.7) {
        if (wR <= 15) return '25 mg';
        if (wR > 22) return '10 mg';
        return '20 mg';
    } else {
        if (wR >= 50 && wR < 80) return '10 mg';
        return '—';
    }
}

function buildTempCurve(power, wire, length, tambF, tmax, matKey) {
    const mat = MATS[matKey];
    const area = Math.PI * Math.pow(wire / 2, 2);
    const massKg = area * length * mat.dens * 1e-9;
    const thermalCap = Math.max(massKg * mat.sh, 1e-6);
    const surfaceArea = Math.PI * wire * length;
    const tambC = fToC(tambF);

    const dt = 0.025;
    const steps = Math.ceil(tmax / dt);
    const labels = [];
    const temps = [];

    let timeToVapeZone = null;
    let timeToOptimalVape = null;
    let timeToTempBurn = null;
    let T = tambC;
    let juice = 1.0;
    let resistance = mat.res * (length / 1000) / area;
    const baseResistance = resistance;
    let damage = 0;
    let overheatTime = 0;
    // E-liquid boiling point (~230°C for PG/VG mix) — used for evap plateau
    const eliqBoilC = 230;

    for (let i = 0; i <= steps; i++) {
        const t = i * dt;
        if (t > tmax) break;
        const tempF = cToF(T);
        if (timeToVapeZone === null && tempF >= 380) timeToVapeZone = t;
        if (timeToOptimalVape === null && tempF >= 450) timeToOptimalVape = t;
        if (timeToTempBurn === null && tempF >= 600) timeToTempBurn = t;

        labels.push(t.toFixed(2));
        temps.push(tempF);

        const tcr = mat.tcr || HEAT_TRANSFER.TCR;
        const tcrFactor = 1 + tcr * (T - 20);
        resistance = baseResistance * tcrFactor;
        // Regulated mod: power stays at target; resistance rise tracked for accuracy
        const effectivePower = power * (baseResistance / resistance);

        juice = Math.max(0, juice - effectivePower * dt * HEAT_TRANSFER.juiceDepletionRate);
        const juiceLevel = juice;

        const heatLoss = getHeatLossAtTemp(T, tambC, surfaceArea, juiceLevel, effectivePower);

        // Evaporative latent heat plateau: extra cooling near e-liquid boiling point
        let evapCooling = 0;
        if (T > eliqBoilC && juiceLevel > 0) {
            evapCooling = (T - eliqBoilC) * surfaceArea * 0.003 * juiceLevel;
        }

        const dT = (effectivePower - heatLoss - evapCooling) / thermalCap;
        T = Math.max(tambC, T + dT * dt);

        if (tempF > 600) {
            overheatTime += dt;
            damage += (tempF - 600) * 0.02 * dt;
        }
    }

    const survivalTime = damage >= 1 ? overheatTime : (timeToTempBurn || tmax);

    return { labels, temps, timeToVapeZone, timeToOptimalVape, timeToTempBurn, survivalTime, damage };
}

function formatVapeTime(timeToVapeZone, tambF, area, length, mat) {
    if (timeToVapeZone !== null && timeToVapeZone <= 0.1) {
        return '< 0.1s';
    }

    if (timeToVapeZone !== null) {
        return timeToVapeZone.toFixed(2) + 's';
    }

    const targetTempF = 380;
    const deltaT_C = Math.max(targetTempF - tambF, 0) * 5 / 9;
    const volumeMm3 = area * length;
    const massKg = volumeMm3 * mat.dens * 1e-9;
    const energyJ = massKg * mat.sh * deltaT_C;
    const minW = Math.max(1, Math.ceil(energyJ / 15));
    return minW + 'W+';
}

function formatVapeTimeNew(timeToVapeZone, timeToOptimalVape, tambF) {
    if (timeToVapeZone !== null && timeToVapeZone <= 0.1) {
        return '< 0.1s';
    }

    if (timeToVapeZone !== null) {
        return timeToVapeZone.toFixed(2) + 's';
    }

    return '—';
}

function getFluxStatus(heatFlux) {
    if (heatFlux < 150) {
        return { color: '#3B6D11', hint: 'Low - may not wick well' };
    }

    if (heatFlux < 250) {
        return { color: '#185FA5', hint: 'Good range' };
    }

    if (heatFlux < 350) {
        return { color: '#BA7517', hint: 'Warm - watch for dry hits' };
    }

    return { color: '#A32D2D', hint: 'High - risk of dry hits' };
}

function calculateCoil(params) {
    const {
        wireAwg,
        material,
        innerDiameter,
        wraps,
        legLength,
        power,
        tambF,
        tmax
    } = params;

    const wire = awgToMm(wireAwg);
    const mat = MATS[material];
    const { totalLength: length, crossSectionArea: area, surfaceArea: surface } =
        getCoilMetrics(wire, innerDiameter, wraps, legLength);

    const resistance = mat.res * (length / 1000) / area;
    const TCR = mat.tcr || HEAT_TRANSFER.TCR;
    const resistanceHot = resistance * (1 + TCR * (200 - 20));
    const effectiveSurface = surface * HEAT_TRANSFER.activeSurfaceFactor;
    const heatFlux = (power / effectiveSurface) * 1000;
    const tambC = fToC(tambF);

    const vapenStartC = fToC(380);
    const vapeUpperC = fToC(450);
    const tempBurnC = fToC(600);

    const minSafePower = Math.max(5, Math.round(getHeatLossAtTemp(vapenStartC, tambC, surface, 1, 0)));
    const maxSafePower = Math.max(minSafePower + 5, Math.round(getHeatLossAtTemp(vapeUpperC, tambC, surface, 1, 0)));
    const instantBurnWatts = Math.max(1, Math.round(getHeatLossAtTemp(tempBurnC, tambC, surface, 1, 0)));

    const chartData = buildTempCurve(power, wire, length, tambF, tmax, material);
    const peakTemp = Math.max(...chartData.temps);
    const survivalTime = chartData.timeToTempBurn || Math.min(tmax, 30);
    const tempBurnTime = chartData.timeToTempBurn !== null ? Math.min(chartData.timeToTempBurn, tmax) : tmax;

    return {
        resistance: resistance.toFixed(3),
        resistanceHot: resistanceHot.toFixed(3),
        heatFlux: Math.round(heatFlux),
        wireLength: length.toFixed(1),
        peakTemp: Math.round(peakTemp),
        timeToVapeZone: chartData.timeToVapeZone,
        timeToOptimalVape: chartData.timeToOptimalVape,
        timeToTempBurn: chartData.timeToTempBurn,
        survivalTime,
        vapeTimeDisplay: formatVapeTime(chartData.timeToVapeZone, tambF, area, length, mat),
        wattageRange: `${minSafePower}–${maxSafePower}W`,
        saltNicStrength: getSaltNicStrength(resistance, power),
        chartData,
        tambF,
        tmax,
        instantBurnWatts,
        currentPower: power,
        fluxBarWidth: Math.min(heatFlux / 500 * 100, 100),
        fluxStatus: getFluxStatus(heatFlux),
        tempBurnTime: tempBurnTime
    };
}

function getTemperatureResistance(R0, alpha, tempC) {
    return R0 * (1 + alpha * (tempC - 20));
}

function getDynamicPower(voltage, resistance) {
    return (voltage * voltage) / resistance;
}

function getEvaporativeCooling(tempC, surfaceAreaMm2, wickSaturation) {
    const boilC = 230;
    if (tempC < boilC || wickSaturation <= 0) return 0;
    const deltaT = tempC - boilC;
    const surfaceAreaM2 = surfaceAreaMm2 / 1e6;
    const kEvap = 0.00015;
    const Lv = 850000;
    return kEvap * surfaceAreaM2 * deltaT * wickSaturation * Lv;
}

module.exports = {
    cToF,
    fToC,
    awgToMm,
    getCoilMetrics,
    getSaltNicStrength,
    buildTempCurve,
    calculateCoil,
    getFluxStatus,
    getTemperatureResistance,
    getDynamicPower,
    getEvaporativeCooling,
    getHeatLossAtTemp
};