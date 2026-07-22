/**
 * Material properties database
 * res: resistivity (Ω·mm²/m)
 * dens: density (kg/m³)
 * sh: specific heat (J/(kg·K))
 */
const MATS = {
    // Kanthal (FeCrAl): density ~7100 kg/m³, specific heat ~460 J/(kg·K)
    ka1: { res: 1.45, dens: 7100, sh: 460 },
    ka: { res: 1.39, dens: 7100, sh: 460 },
    kd: { res: 1.35, dens: 7100, sh: 460 },
    // Nichrome (NiCr): density ~8400 kg/m³, specific heat ~450 J/(kg·K)
    n20: { res: 1.05, dens: 8400, sh: 450 },
    n40: { res: 1.09, dens: 8400, sh: 450 },
    n60: { res: 1.12, dens: 8400, sh: 450 },
    n70: { res: 1.14, dens: 8400, sh: 450 },
    n80: { res: 1.10, dens: 8400, sh: 450 },
    n90: { res: 1.18, dens: 8400, sh: 450 },
    ss304: { res: 0.72, dens: 8000, sh: 500 },
    ss316: { res: 0.74, dens: 8000, sh: 500 },
    ss316l: { res: 0.75, dens: 8000, sh: 500 },
    ss317l: { res: 0.79, dens: 8000, sh: 500 },
    ss321: { res: 0.72, dens: 8000, sh: 500 },
    ss430: { res: 0.60, dens: 8000, sh: 500 },
    ss904l: { res: 0.95, dens: 8000, sh: 500 },
    au: { res: 0.022, dens: 19300, sh: 129 },
    ag: { res: 0.016, dens: 10490, sh: 235 },
    cu: { res: 0.017, dens: 8960, sh: 385 },
    ti1: { res: 0.42, dens: 4500, sh: 520 },
    ti2: { res: 0.44, dens: 4500, sh: 520 },
    tie: { res: 0.43, dens: 4500, sh: 520 },
    w: { res: 0.056, dens: 19300, sh: 134 },
    nio: { res: 1.50, dens: 8900, sh: 440 },
    ni200lin: { res: 0.085, dens: 8900, sh: 440 },
    ni200: { res: 0.085, dens: 8900, sh: 440 },
    nife30: { res: 1.00, dens: 8000, sh: 500 },
    dicodes: { res: 1.00, dens: 8000, sh: 500 },
    reactor: { res: 1.02, dens: 8000, sh: 500 },
    nife30stealth: { res: 1.00, dens: 8000, sh: 500 },
    invar36: { res: 0.80, dens: 8000, sh: 515 },
    nidh: { res: 1.10, dens: 8900, sh: 440 },
    nft70: { res: 1.20, dens: 8000, sh: 500 },
    nft52: { res: 1.25, dens: 8000, sh: 500 },
    zr: { res: 0.40, dens: 6500, sh: 278 }
};

const MATERIAL_NAMES = {
    n80: 'Nichrome N80 (A)',
    n20: 'Nichrome N20',
    n40: 'Nichrome N40',
    n60: 'Nichrome N60 (C)',
    n70: 'Nichrome N70 (B)',
    n90: 'Nichrome N90',
    ka1: 'Kanthal A1 / APM',
    ka: 'Kanthal A / AE / AF',
    kd: 'Kanthal D',
    ss304: 'SS 304',
    ss316: 'SS 316',
    ss316l: 'SS 316L / Elite',
    ss317l: 'SS 317L / Haywire',
    ss321: 'SS 321',
    ss430: 'SS 430',
    ss904l: 'SS 904L',
    au: 'Gold',
    ag: 'Silver',
    cu: 'Copper',
    ti1: 'Titanium 1',
    ti2: 'Titanium 2 (R50400)',
    tie: 'Titanium ready (e-SG)',
    w: 'Tungsten',
    nio: 'Niobium alloy',
    ni200lin: 'Nickel Ni200 (linear TCR)',
    ni200: 'Nickel Ni200 (TFR curve)',
    nife30: 'NiFe30 (Resistherm - TFR)',
    dicodes: 'NiFe30 (Resistherm - TCR)',
    reactor: 'NiFe (Reactor Wire)',
    nife30stealth: 'NiFe30 (StealthVape)',
    invar36: 'Invar 36 / Nilo 36',
    nidh: 'Nickel DH',
    nft70: 'Nifethal 70 (Alloy120)',
    nft52: 'Nifethal 52 (Alloy52)',
    zr: 'Zirconium (pure)'
};

module.exports = {
    MATS,
    MATERIAL_NAMES
};
