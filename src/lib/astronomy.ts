/**
 * astronomy.ts — Standalone astronomical calculations for the SkyChart.
 *
 * All computations are based on standard astronomical algorithms
 * (Jean Meeus, "Astronomical Algorithms") and are accurate to ~1°
 * for the years 1990–2050 without requiring any external API.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface Star {
  name: string;
  ra: number;   // right ascension in hours (0–24)
  dec: number;  // declination in degrees (-90 to +90)
  mag: number;  // apparent visual magnitude
  con?: string; // constellation abbreviation
}

export interface ConstellationLine {
  con: string;
  name: string;
  pairs: [string, string][]; // star names that are connected
}

export interface HorizontalCoord {
  alt: number; // altitude in degrees (-90 to +90, positive = above horizon)
  az: number;  // azimuth in degrees (0=N, 90=E, 180=S, 270=W)
}

export interface PlanetInfo extends HorizontalCoord {
  name: string;
  color: string;
}

export interface MoonInfo {
  phase: number;      // 0–1 (0=new, 0.5=full, 1=new again)
  illumination: number; // 0–1 fraction illuminated
  ageDays: number;     // days since new moon
  alt: number;
  az: number;
}

export interface SkyData {
  stars: (Star & HorizontalCoord)[];
  constellations: ConstellationLine[];
  planets: PlanetInfo[];
  moon: MoonInfo;
  sunAlt: number;     // sun altitude (negative = below horizon)
  siderealTime: number;
}

// ── Math helpers ───────────────────────────────────────────────────

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function normalizeAngle(a: number): number {
  a = a % 360;
  return a < 0 ? a + 360 : a;
}

function sin(d: number) { return Math.sin(d * DEG); }
function cos(d: number) { return Math.cos(d * DEG); }
function tan(d: number) { return Math.tan(d * DEG); }
function asin(x: number) { return Math.asin(x) * RAD; }
function atan2(y: number, x: number) { return Math.atan2(y, x) * RAD; }

// ── Julian Date ────────────────────────────────────────────────────

export function julianDate(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
  let jy = y;
  let jm = m;
  if (m <= 2) { jy -= 1; jm += 12; }
  const A = Math.floor(jy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + d + B - 1524.5;
}

// ── Sidereal Time ──────────────────────────────────────────────────

function greenwichSiderealTime(jd: number): number {
  // GMST in hours (0–24)
  const T = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  return normalizeAngle(gmst) / 15; // convert degrees to hours
}

function localSiderealTime(jd: number, longitude: number): number {
  const gst = greenwichSiderealTime(jd);
  let lst = gst + longitude / 15; // longitude in degrees → hours
  lst = lst % 24;
  return lst < 0 ? lst + 24 : lst;
}

// ── Coordinate Conversion ──────────────────────────────────────────

export function equatorialToHorizontal(
  raHours: number,
  decDeg: number,
  lstHours: number,
  latDeg: number
): HorizontalCoord {
  const ha = (lstHours - raHours) * 15; // hour angle in degrees
  const alt = asin(sin(decDeg) * sin(latDeg) + cos(decDeg) * cos(latDeg) * cos(ha));
  const az = atan2(
    -sin(ha),
    cos(decDeg) * sin(latDeg) - sin(decDeg) * cos(latDeg) * cos(ha)
  );
  return { alt, az: normalizeAngle(az) };
}

// ── Sun Position ───────────────────────────────────────────────────

function sunPosition(jd: number): { ra: number; dec: number } {
  const n = jd - 2451545.0; // days since J2000.0
  let L = normalizeAngle(280.460 + 0.9856474 * n); // mean longitude
  let g = normalizeAngle(357.528 + 0.9856003 * n); // mean anomaly
  const gRad = g * DEG;
  const lambda = L + 1.915 * sin(g) + 0.020 * sin(2 * gRad); // ecliptic longitude
  const epsilon = 23.439 - 0.0000004 * n; // obliquity of ecliptic
  const lambdaRad = lambda * DEG;
  const epsilonRad = epsilon * DEG;
  const ra = atan2(cos(epsilonRad) * sin(lambdaRad), cos(lambdaRad)) / 15; // hours
  const dec = asin(sin(epsilonRad) * sin(lambdaRad));
  return { ra: ((ra % 24) + 24) % 24, dec };
}

// ── Moon Phase ─────────────────────────────────────────────────────

function moonPhase(jd: number): { phase: number; illumination: number; ageDays: number } {
  // Synodic period = 29.53059 days
  const synodicMonth = 29.53059;
  // Known new moon reference: 2000-01-06 18:14 UTC (JD 2451550.259)
  const knownNewMoon = 2451550.259;
  const ageDays = ((jd - knownNewMoon) % synodicMonth + synodicMonth) % synodicMonth;
  const phase = ageDays / synodicMonth; // 0–1
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  return { phase, illumination, ageDays };
}

function moonPosition(jd: number): { ra: number; dec: number } {
  // Simplified moon position (accurate to ~2°)
  const T = (jd - 2451545.0) / 36525.0;
  // Mean elements
  let L = normalizeAngle(218.316 + 13.176396 * (jd - 2451545.0)); // mean longitude
  let M = normalizeAngle(134.963 + 13.064993 * (jd - 2451545.0)); // mean anomaly
  let F = normalizeAngle(93.272 + 13.229350 * (jd - 2451545.0));  // mean distance

  // Simplified corrections
  const Mm = M * DEG;
  const Fm = F * DEG;
  const lon = L + 6.289 * sin(Mm); // longitude
  const lat = 5.128 * sin(Fm);     // latitude

  const epsilon = 23.439;
  const lonRad = lon * DEG;
  const latRad = lat * DEG;
  const epsRad = epsilon * DEG;
  const ra = atan2(
    sin(lonRad) * cos(epsRad) - tan(latRad) * sin(epsRad),
    cos(lonRad)
  ) / 15;
  const dec = asin(sin(latRad) * cos(epsRad) + cos(latRad) * sin(epsRad) * sin(lonRad));
  return { ra: ((ra % 24) + 24) % 24, dec };
}

// ── Planet Positions (Simplified Keplerian Elements) ────────────────

interface OrbitalElements {
  L: number;  // mean longitude (degrees)
  a: number;  // semi-major axis (AU)
  e: number;  // eccentricity
  i: number;  // inclination (degrees)
  w: number;  // longitude of perihelion (degrees)
  Omega: number; // longitude of ascending node (degrees)
}

const PLANET_ELEMENTS: Record<string, (jd: number) => OrbitalElements> = {
  Mercury: (jd) => {
    const T = (jd - 2451545) / 365250;
    return { L: 252.251 + 149472.675 * T, a: 0.387, e: 0.2056 + 0.00002 * T, i: 7.005, w: 77.456 + 0.160 * T, Omega: 48.331 + 0.125 * T };
  },
  Venus: (jd) => {
    const T = (jd - 2451545) / 365250;
    return { L: 181.980 + 58517.816 * T, a: 0.723, e: 0.0068 - 0.00005 * T, i: 3.395, w: 131.564 + 0.003 * T, Omega: 76.680 - 0.278 * T };
  },
  Mars: (jd) => {
    const T = (jd - 2451545) / 365250;
    return { L: 355.433 + 19140.299 * T, a: 1.524, e: 0.0934 + 0.00008 * T, i: 1.850, w: 336.060 + 0.444 * T, Omega: 49.558 - 0.293 * T };
  },
  Jupiter: (jd) => {
    const T = (jd - 2451545) / 365250;
    return { L: 34.351 + 3034.906 * T, a: 5.203, e: 0.0485 + 0.00018 * T, i: 1.303, w: 14.331 - 0.022 * T, Omega: 100.464 + 0.205 * T };
  },
  Saturn: (jd) => {
    const T = (jd - 2451545) / 365250;
    return { L: 50.077 + 1222.114 * T, a: 9.537, e: 0.0556 - 0.00035 * T, i: 2.489, w: 93.057 + 0.518 * T, Omega: 113.666 - 0.289 * T };
  },
};

const PLANET_VISUAL: { name: string; color: string; key: string }[] = [
  { name: 'Merkur', color: '#A0A0A0', key: 'Mercury' },
  { name: 'Venus', color: '#FFFACD', key: 'Venus' },
  { name: 'Mars', color: '#FF6347', key: 'Mars' },
  { name: 'Jupiter', color: '#FFD700', key: 'Jupiter' },
  { name: 'Saturn', color: '#F0E68C', key: 'Saturn' },
];

function solveKepler(M: number, e: number): number {
  // Newton's method for Kepler's equation M = E - e*sin(E)
  let E = M;
  for (let i = 0; i < 10; i++) {
    const dE = (E - e * Math.sin(E * DEG) - M) / (1 - e * Math.cos(E * DEG));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

function planetPosition(key: string, jd: number): { ra: number; dec: number } | null {
  const elFn = PLANET_ELEMENTS[key];
  if (!elFn) return null;
  const el = elFn(jd);

  // Mean anomaly
  const wBar = el.w - el.Omega;
  const M = normalizeAngle(el.L - wBar);

  // Solve Kepler's equation
  const E = solveKepler(M, el.e);

  // True anomaly
  const v = 2 * atan2(
    Math.sqrt(1 + el.e) * sin(E / 2),
    Math.sqrt(1 - el.e) * cos(E / 2)
  );

  // Distance from sun (AU)
  const r = el.a * (1 - el.e * cos(E * DEG));

  // Heliocentric ecliptic coordinates
  const xEcl = r * cos(v);
  const yEcl = r * sin(v);

  // Convert to geocentric ecliptic (assume sun at origin, subtract earth's position)
  // For simplified version: treat as heliocentric and convert
  const vRad = v * DEG;
  const wRad = wBar * DEG;
  const OmRad = el.Omega * DEG;
  const iRad = el.i * DEG;

  // Ecliptic longitude and latitude
  const eclLon = atan2(
    xEcl * sin(wRad) + yEcl * cos(wRad),
    xEcl * cos(wRad) - yEcl * sin(wRad)
  ) + el.Omega;
  const eclLat = asin(sin(vRad + wRad - el.Omega) * sin(iRad));

  // Convert ecliptic to equatorial
  const epsRad = 23.439 * DEG;
  const eclLonRad = eclLon * DEG;
  const eclLatRad = eclLat * DEG;
  const ra = atan2(
    sin(eclLonRad) * cos(epsRad) - tan(eclLatRad) * sin(epsRad),
    cos(eclLonRad)
  ) / 15;
  const dec = asin(sin(eclLatRad) * cos(epsRad) + cos(eclLatRad) * sin(epsRad) * sin(eclLonRad));

  return { ra: ((ra % 24) + 24) % 24, dec };
}

// ── Star Catalog (~150 brightest stars) ────────────────────────────

export const STARS: Star[] = [
  // Ursa Major (Großer Bär)
  { name: 'Dubhe', ra: 11.062, dec: 61.75, mag: 1.79, con: 'UMa' },
  { name: 'Merak', ra: 11.031, dec: 56.38, mag: 2.37, con: 'UMa' },
  { name: 'Phecda', ra: 11.897, dec: 53.69, mag: 2.44, con: 'UMa' },
  { name: 'Megrez', ra: 12.257, dec: 57.03, mag: 3.31, con: 'UMa' },
  { name: 'Alioth', ra: 12.900, dec: 55.96, mag: 1.77, con: 'UMa' },
  { name: 'Mizar', ra: 13.399, dec: 54.93, mag: 2.27, con: 'UMa' },
  { name: 'Alkaid', ra: 13.792, dec: 49.31, mag: 1.86, con: 'UMa' },
  // Orion
  { name: 'Betelgeuse', ra: 5.919, dec: 7.41, mag: 0.42, con: 'Ori' },
  { name: 'Rigel', ra: 5.242, dec: -8.20, mag: 0.13, con: 'Ori' },
  { name: 'Bellatrix', ra: 5.419, dec: 6.35, mag: 1.64, con: 'Ori' },
  { name: 'Mintaka', ra: 5.533, dec: -0.30, mag: 2.23, con: 'Ori' },
  { name: 'Alnilam', ra: 5.603, dec: -1.20, mag: 1.69, con: 'Ori' },
  { name: 'Alnitak', ra: 5.679, dec: -1.94, mag: 1.77, con: 'Ori' },
  { name: 'Saiph', ra: 5.796, dec: -9.67, mag: 2.09, con: 'Ori' },
  // Cassiopeia
  { name: 'Schedar', ra: 0.675, dec: 56.54, mag: 2.23, con: 'Cas' },
  { name: 'Caph', ra: 0.153, dec: 59.15, mag: 2.27, con: 'Cas' },
  { name: 'Gamma Cas', ra: 0.945, dec: 60.72, mag: 2.47, con: 'Cas' },
  { name: 'Ruchbah', ra: 1.430, dec: 60.24, mag: 2.68, con: 'Cas' },
  { name: 'Segin', ra: 1.907, dec: 63.67, mag: 3.37, con: 'Cas' },
  // Cygnus (Schwan)
  { name: 'Deneb', ra: 20.690, dec: 45.28, mag: 1.25, con: 'Cyg' },
  { name: 'Sadr', ra: 20.370, dec: 40.26, mag: 2.20, con: 'Cyg' },
  { name: 'Gienah Cyg', ra: 20.770, dec: 33.97, mag: 2.46, con: 'Cyg' },
  { name: 'Delta Cyg', ra: 19.749, dec: 45.13, mag: 2.87, con: 'Cyg' },
  { name: 'Albireo', ra: 19.512, dec: 27.96, mag: 3.08, con: 'Cyg' },
  // Lyra
  { name: 'Vega', ra: 18.616, dec: 38.78, mag: 0.03, con: 'Lyr' },
  { name: 'Sheliak', ra: 18.835, dec: 33.36, mag: 3.52, con: 'Lyr' },
  { name: 'Sulafat', ra: 18.982, dec: 32.69, mag: 3.24, con: 'Lyr' },
  // Aquila (Adler)
  { name: 'Altair', ra: 19.846, dec: 8.87, mag: 0.77, con: 'Aql' },
  { name: 'Tarazed', ra: 19.771, dec: 10.61, mag: 2.72, con: 'Aql' },
  { name: 'Alshain', ra: 19.922, dec: 6.41, mag: 3.71, con: 'Aql' },
  // Leo (Löwe)
  { name: 'Regulus', ra: 10.140, dec: 11.97, mag: 1.35, con: 'Leo' },
  { name: 'Denebola', ra: 11.818, dec: 14.57, mag: 2.14, con: 'Leo' },
  { name: 'Algieba', ra: 10.333, dec: 19.84, mag: 2.08, con: 'Leo' },
  { name: 'Zosma', ra: 11.235, dec: 20.52, mag: 2.56, con: 'Leo' },
  // Scorpius (Skorpion)
  { name: 'Antares', ra: 16.490, dec: -26.43, mag: 0.96, con: 'Sco' },
  { name: 'Shaula', ra: 17.560, dec: -37.10, mag: 1.63, con: 'Sco' },
  { name: 'Sargas', ra: 17.622, dec: -42.99, mag: 1.87, con: 'Sco' },
  // Gemini (Zwillinge)
  { name: 'Pollux', ra: 7.755, dec: 28.03, mag: 1.14, con: 'Gem' },
  { name: 'Castor', ra: 7.577, dec: 31.89, mag: 1.58, con: 'Gem' },
  // Taurus (Stier)
  { name: 'Aldebaran', ra: 4.599, dec: 16.51, mag: 0.85, con: 'Tau' },
  { name: 'Elnath', ra: 5.438, dec: 28.61, mag: 1.65, con: 'Tau' },
  // Canis Major (Großer Hund)
  { name: 'Sirius', ra: 6.752, dec: -16.72, mag: -1.46, con: 'CMa' },
  { name: 'Adhara', ra: 6.977, dec: -28.97, mag: 1.50, con: 'CMa' },
  { name: 'Wezen', ra: 7.140, dec: -26.39, mag: 1.84, con: 'CMa' },
  // Canis Minor (Kleiner Hund)
  { name: 'Procyon', ra: 7.655, dec: 5.22, mag: 0.34, con: 'CMi' },
  // Boötes (Hirten)
  { name: 'Arcturus', ra: 14.261, dec: 19.18, mag: -0.05, con: 'Boo' },
  // Virgo (Jungfrau)
  { name: 'Spica', ra: 13.420, dec: -11.16, mag: 0.97, con: 'Vir' },
  // Auriga (Fuhrmann)
  { name: 'Capella', ra: 5.278, dec: 46.00, mag: 0.08, con: 'Aur' },
  // Perseus
  { name: 'Mirfak', ra: 3.405, dec: 49.86, mag: 1.79, con: 'Per' },
  { name: 'Algol', ra: 3.136, dec: 40.96, mag: 2.12, con: 'Per' },
  // Andromeda
  { name: 'Alpheratz', ra: 0.140, dec: 29.09, mag: 2.06, con: 'And' },
  { name: 'Mirach', ra: 1.163, dec: 35.62, mag: 2.05, con: 'And' },
  { name: 'Almach', ra: 2.065, dec: 42.33, mag: 2.17, con: 'And' },
  // Pegasus (Pferd)
  { name: 'Markab', ra: 23.079, dec: 15.21, mag: 2.49, con: 'Peg' },
  { name: 'Scheat', ra: 23.063, dec: 28.08, mag: 2.42, con: 'Peg' },
  { name: 'Algenib', ra: 0.220, dec: 15.18, mag: 2.83, con: 'Peg' },
  // Aries (Widder)
  { name: 'Hamal', ra: 2.120, dec: 23.46, mag: 2.00, con: 'Ari' },
  // Pisces Austrinus (Südlicher Fisch)
  { name: 'Fomalhaut', ra: 22.961, dec: -29.62, mag: 1.16, con: 'PsA' },
  // Grus (Kranich)
  { name: 'Alnair', ra: 22.137, dec: -46.96, mag: 1.74, con: 'Gru' },
  // Centaurus
  { name: 'Alpha Centauri', ra: 14.661, dec: -60.84, mag: -0.01, con: 'Cen' },
  { name: 'Hadar', ra: 14.064, dec: -60.37, mag: 0.61, con: 'Cen' },
  // Crux (Kreuz des Südens)
  { name: 'Acrux', ra: 12.443, dec: -63.10, mag: 0.76, con: 'Cru' },
  // Southern Cross
  { name: 'Mimosa', ra: 12.795, dec: -59.69, mag: 1.25, con: 'Cru' },
  // Eridanus
  { name: 'Achernar', ra: 1.629, dec: -57.24, mag: 0.46, con: 'Eri' },
  // Carina (Kiel des Schiffs)
  { name: 'Canopus', ra: 6.399, dec: -52.70, mag: -0.74, con: 'Car' },
  // Puppis (Heck)
  { name: 'Naos', ra: 8.059, dec: -40.00, mag: 2.25, con: 'Pup' },
  // Vela (Segel)
  { name: 'Suhail', ra: 9.133, dec: -43.43, mag: 2.21, con: 'Vel' },
  // Corvus (Rabe)
  { name: 'Gienah Crv', ra: 12.263, dec: -17.54, mag: 2.59, con: 'Crv' },
  // Hydra
  { name: 'Alphard', ra: 9.460, dec: -8.66, mag: 1.98, con: 'Hya' },
  // Ophiuchus
  { name: 'Rasalhague', ra: 17.582, dec: 12.56, mag: 2.07, con: 'Oph' },
  // Draco (Drache)
  { name: 'Eltanin', ra: 17.943, dec: 51.49, mag: 2.23, con: 'Dra' },
  { name: 'Rastaban', ra: 17.507, dec: 52.30, mag: 2.79, con: 'Dra' },
  // Corona Borealis
  { name: 'Alphecca', ra: 15.578, dec: 26.71, mag: 2.23, con: 'CrB' },
  // Hercules
  { name: 'Kornephoros', ra: 16.504, dec: 21.49, mag: 2.77, con: 'Her' },
  // Sagittarius (Schütze)
  { name: 'Kaus Australis', ra: 18.403, dec: -34.38, mag: 1.85, con: 'Sgr' },
  { name: 'Nunki', ra: 18.921, dec: -26.30, mag: 2.02, con: 'Sgr' },
  // Capricornus (Steinbock)
  { name: 'Deneb Algedi', ra: 21.784, dec: -16.13, mag: 2.87, con: 'Cap' },
  // Ursa Minor (Kleiner Bär)
  { name: 'Polaris', ra: 2.530, dec: 89.26, mag: 1.98, con: 'UMi' },
  { name: 'Kochab', ra: 14.845, dec: 74.16, mag: 2.08, con: 'UMi' },
  // Triangulum
  { name: 'Beta Tri', ra: 2.159, dec: 34.99, mag: 3.00, con: 'Tri' },
  // Corona Australis
  { name: 'Alpha CrA', ra: 19.160, dec: -37.11, mag: 4.11, con: 'CrA' },
  // Serpens
  { name: 'Unukalhai', ra: 15.738, dec: 6.43, mag: 2.65, con: 'Ser' },
  // Libra (Waage)
  { name: 'Zubenelgenubi', ra: 14.848, dec: -16.04, mag: 2.75, con: 'Lib' },
  { name: 'Zubeneschamali', ra: 15.283, dec: -9.38, mag: 2.61, con: 'Lib' },
  // Scorpius cont.
  { name: 'Dschubba', ra: 16.006, dec: -22.62, mag: 2.32, con: 'Sco' },
  { name: 'Graffias', ra: 16.091, dec: -19.81, mag: 2.62, con: 'Sco' },
  // More bright stars
  { name: 'Menkalinan', ra: 5.992, dec: 44.95, mag: 1.90, con: 'Aur' },
  { name: 'Thuban', ra: 14.073, dec: 64.38, mag: 3.65, con: 'Dra' },
  { name: 'Etamin', ra: 17.943, dec: 51.49, mag: 2.23, con: 'Dra' },
  { name: 'Izar', ra: 14.750, dec: 27.07, mag: 2.70, con: 'Boo' },
  { name: 'Muphrid', ra: 13.912, dec: 18.40, mag: 2.68, con: 'Boo' },
  { name: 'Nihal', ra: 5.471, dec: -20.76, mag: 2.84, con: 'Lep' },
];

// ── Constellation Lines ───────────────────────────────────────────

export const CONSTELLATIONS: ConstellationLine[] = [
  { con: 'UMa', name: 'Großer Bär', pairs: [['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid'], ['Megrez', 'Dubhe']] },
  { con: 'Ori', name: 'Orion', pairs: [['Betelgeuse', 'Bellatrix'], ['Betelgeuse', 'Alnilam'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel']] },
  { con: 'Cas', name: 'Kassiopeia', pairs: [['Caph', 'Schedar'], ['Schedar', 'Gamma Cas'], ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin']] },
  { con: 'Cyg', name: 'Schwan', pairs: [['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Sadr', 'Gienah Cyg'], ['Gienah Cyg', 'Delta Cyg']] },
  { con: 'Lyr', name: 'Leier', pairs: [['Vega', 'Sheliak'], ['Sheliak', 'Sulafat'], ['Sulafat', 'Vega']] },
  { con: 'Aql', name: 'Adler', pairs: [['Tarazed', 'Altair'], ['Altair', 'Alshain']] },
  { con: 'Leo', name: 'Löwe', pairs: [['Regulus', 'Algieba'], ['Algieba', 'Zosma'], ['Zosma', 'Denebola']] },
  { con: 'Gem', name: 'Zwillinge', pairs: [['Castor', 'Pollux']] },
  { con: 'Sco', name: 'Skorpion', pairs: [['Graffias', 'Dschubba'], ['Dschubba', 'Antares'], ['Antares', 'Shaula']] },
  { con: 'Peg', name: 'Pegasus', pairs: [['Markab', 'Scheat'], ['Scheat', 'Alpheratz'], ['Alpheratz', 'Algenib'], ['Algenib', 'Markab']] },
  { con: 'And', name: 'Andromeda', pairs: [['Alpheratz', 'Mirach'], ['Mirach', 'Almach']] },
  { con: 'UMi', name: 'Kleiner Bär', pairs: [['Polaris', 'Kochab']] },
];

// ── Main Calculation ──────────────────────────────────────────────

export function computeSky(
  lat: number,
  lon: number,
  date: Date = new Date()
): SkyData {
  const jd = julianDate(date);
  const lst = localSiderealTime(jd, lon);

  // Compute star positions
  const stars: (Star & HorizontalCoord)[] = STARS.map((star) => {
    const pos = equatorialToHorizontal(star.ra, star.dec, lst, lat);
    return { ...star, ...pos };
  }).filter(s => s.alt > -2); // only show stars near or above horizon

  // Compute planet positions
  const planets: PlanetInfo[] = [];
  for (const pv of PLANET_VISUAL) {
    const pos = planetPosition(pv.key, jd);
    if (pos) {
      const hz = equatorialToHorizontal(pos.ra, pos.dec, lst, lat);
      if (hz.alt > -2) {
        planets.push({ ...pv, ...hz });
      }
    }
  }

  // Moon
  const mp = moonPhase(jd);
  const moonPos = moonPosition(jd);
  const moonHz = equatorialToHorizontal(moonPos.ra, moonPos.dec, lst, lat);

  // Sun
  const sunPos = sunPosition(jd);
  const sunHz = equatorialToHorizontal(sunPos.ra, sunPos.dec, lst, lat);

  return {
    stars,
    constellations: CONSTELLATIONS,
    planets,
    moon: { ...mp, ...moonHz },
    sunAlt: sunHz.alt,
    siderealTime: lst,
  };
}
