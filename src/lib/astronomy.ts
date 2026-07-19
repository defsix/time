// Client-side solar and lunar position formulas — no network dependency, so
// these never show a loading/error state. Sunrise/sunset uses the standard
// "sunrise equation" (see e.g. https://en.wikipedia.org/wiki/Sunrise_equation
// and https://aa.quae.nl/en/reken/zonpositie.html), accurate to roughly a
// minute. Moon phase uses a fixed-synodic-month approximation referenced to a
// known new moon, accurate to within a few hours — plenty for a phase name
// and illumination percentage. subSolarPoint/subLunarPoint (further down)
// compute where each body is actually overhead right now — real right
// ascension/declination via Meeus' low-precision lunar series for the moon,
// converted to a ground point via Greenwich Mean Sidereal Time — for the
// globe's day/night terminator and its sun/moon position markers.

const RAD = Math.PI / 180
const DAY_MS = 86400000
const J1970 = 2440588
const J2000 = 2451545
const OBLIQUITY = RAD * 23.4397

function toJulian(date: Date): number {
  return date.getTime() / DAY_MS - 0.5 + J1970
}

function fromJulian(j: number): Date {
  return new Date((j + 0.5 - J1970) * DAY_MS)
}

function toDays(date: Date): number {
  return toJulian(date) - J2000
}

function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d)
}

function eclipticLongitude(M: number): number {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M))
  const P = RAD * 102.9372
  return M + C + P + Math.PI
}

function declination(l: number): number {
  return Math.asin(Math.sin(l) * Math.sin(OBLIQUITY))
}

function julianCycle(d: number, lw: number): number {
  return Math.round(d - 0.0009 - lw / (2 * Math.PI))
}

function approxTransit(Ht: number, lw: number, n: number): number {
  return 0.0009 + (Ht + lw) / (2 * Math.PI) + n
}

function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)
}

export interface SunTimes {
  sunrise: Date | null
  sunset: Date | null
  solarNoon: Date
  dayLengthMinutes: number | null
  alwaysDay: boolean
  alwaysNight: boolean
}

export function getSunTimes(date: Date, lat: number, lon: number): SunTimes {
  const lw = RAD * -lon
  const phi = RAD * lat
  const d = toDays(date)
  const n = julianCycle(d, lw)
  const ds = approxTransit(0, lw, n)
  const M = solarMeanAnomaly(ds)
  const L = eclipticLongitude(M)
  const dec = declination(L)
  const Jnoon = solarTransitJ(ds, M, L)
  const solarNoon = fromJulian(Jnoon)

  const h0 = RAD * -0.833 // standard sunrise/sunset altitude (accounts for atmospheric refraction + solar radius)
  const cosH = (Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec))

  if (cosH > 1) {
    return { sunrise: null, sunset: null, solarNoon, dayLengthMinutes: null, alwaysDay: false, alwaysNight: true }
  }
  if (cosH < -1) {
    return { sunrise: null, sunset: null, solarNoon, dayLengthMinutes: null, alwaysDay: true, alwaysNight: false }
  }

  const H = Math.acos(cosH)
  const Jset = solarTransitJ(approxTransit(H, lw, n), M, L)
  const Jrise = Jnoon - (Jset - Jnoon)
  const sunrise = fromJulian(Jrise)
  const sunset = fromJulian(Jset)
  const dayLengthMinutes = (sunset.getTime() - sunrise.getTime()) / 60000

  return { sunrise, sunset, solarNoon, dayLengthMinutes, alwaysDay: false, alwaysNight: false }
}

export interface MoonPhase {
  phase: number // 0 = new moon, 0.5 = full moon, approaching 1 = new moon again
  illumination: number // 0..1
  name: string
  waxing: boolean
}

const SYNODIC_MONTH_DAYS = 29.530588853
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0)

export function getMoonPhase(date: Date): MoonPhase {
  const diffDays = (date.getTime() - KNOWN_NEW_MOON_MS) / DAY_MS
  let phase = (diffDays % SYNODIC_MONTH_DAYS) / SYNODIC_MONTH_DAYS
  if (phase < 0) phase += 1
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2

  let name: string
  if (phase < 0.02 || phase > 0.98) name = 'New Moon'
  else if (phase < 0.24) name = 'Waxing Crescent'
  else if (phase < 0.26) name = 'First Quarter'
  else if (phase < 0.49) name = 'Waxing Gibbous'
  else if (phase < 0.51) name = 'Full Moon'
  else if (phase < 0.74) name = 'Waning Gibbous'
  else if (phase < 0.76) name = 'Last Quarter'
  else name = 'Waning Crescent'

  return { phase, illumination, name, waxing: phase < 0.5 }
}

// SVG path for a moon-phase disc icon of radius r centered at (r, r), as the
// lit region within a circle of that radius. Derived from the standard
// "lune" construction: one boundary is a fixed half-circle (right side while
// waxing toward full, left side while waning back toward new), the other is
// a terminator ellipse whose horizontal radius/sweep tracks the phase.
function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

// Converts ecliptic coordinates (radians) to equatorial right
// ascension/declination (radians) using Earth's axial tilt.
function eclipticToEquatorial(lambda: number, beta: number): { ra: number; dec: number } {
  const dec = Math.asin(Math.sin(beta) * Math.cos(OBLIQUITY) + Math.cos(beta) * Math.sin(OBLIQUITY) * Math.sin(lambda))
  const ra = Math.atan2(
    Math.sin(lambda) * Math.cos(OBLIQUITY) - Math.tan(beta) * Math.sin(OBLIQUITY),
    Math.cos(lambda),
  )
  return { ra, dec }
}

// Greenwich Mean Sidereal Time (radians), standard IAU 1982 polynomial.
function greenwichMeanSiderealTime(date: Date): number {
  const d = toDays(date)
  const T = d / 36525
  const gmstDeg = mod360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000)
  return RAD * gmstDeg
}

// The point on Earth directly beneath a body at the given right
// ascension/declination right now (i.e. where it's at its zenith) — the
// same "sub-point" concept the day/night terminator already used for the
// sun (subSolarPoint below), generalized so the moon can share it too.
function subPointFromEquatorial(ra: number, dec: number, date: Date): { lat: number; lon: number } {
  const gmst = greenwichMeanSiderealTime(date)
  const lonDeg = (((ra - gmst) / RAD + 180) % 360 + 360) % 360 - 180
  return { lat: dec / RAD, lon: lonDeg }
}

/** Where the sun is directly overhead right now — powers the day/night terminator and the sun marker on the globe. */
export function subSolarPoint(date: Date): { lat: number; lon: number } {
  const d = toDays(date)
  const M = solarMeanAnomaly(d)
  const L = eclipticLongitude(M)
  const { ra, dec } = eclipticToEquatorial(L, 0)
  return subPointFromEquatorial(ra, dec, date)
}

// Meeus' low-precision lunar position (Astronomical Algorithms, ch. 47) —
// accurate to roughly 10' in ecliptic longitude and 4' in latitude, plenty
// for a visual marker position (not eclipse-prediction grade).
function moonEclipticPosition(date: Date): { lambda: number; beta: number } {
  const T = toDays(date) / 36525

  const Lp = RAD * mod360(218.3164477 + 481267.88123421 * T)
  const D = RAD * mod360(297.8501921 + 445267.1114034 * T)
  const M = RAD * mod360(357.5291092 + 35999.0502909 * T)
  const Mp = RAD * mod360(134.9633964 + 477198.8675055 * T)
  const F = RAD * mod360(93.272095 + 483202.0175233 * T)

  const lambda =
    Lp +
    RAD *
      (6.289 * Math.sin(Mp) -
        1.274 * Math.sin(Mp - 2 * D) +
        0.658 * Math.sin(2 * D) -
        0.186 * Math.sin(M) -
        0.059 * Math.sin(2 * Mp - 2 * D) -
        0.057 * Math.sin(Mp - 2 * D + M) +
        0.053 * Math.sin(Mp + 2 * D) +
        0.046 * Math.sin(2 * D - M) +
        0.041 * Math.sin(Mp - M) -
        0.035 * Math.sin(D) -
        0.031 * Math.sin(Mp + M) -
        0.015 * Math.sin(2 * F - 2 * D) +
        0.011 * Math.sin(Mp - 4 * D))

  const beta =
    RAD *
    (5.128 * Math.sin(F) +
      0.281 * Math.sin(Mp + F) -
      0.278 * Math.sin(F - Mp) -
      0.173 * Math.sin(2 * D - F) +
      0.055 * Math.sin(2 * D - Mp + F) +
      0.046 * Math.sin(2 * D - Mp - F) +
      0.033 * Math.sin(2 * D + F) +
      0.017 * Math.sin(2 * Mp + F) +
      0.011 * Math.sin(2 * D - 2 * Mp - F))

  return { lambda, beta }
}

/** Where the moon is directly overhead right now — powers the moon marker on the globe. */
export function subLunarPoint(date: Date): { lat: number; lon: number } {
  const { lambda, beta } = moonEclipticPosition(date)
  const { ra, dec } = eclipticToEquatorial(lambda, beta)
  return subPointFromEquatorial(ra, dec, date)
}

export function moonPhasePathD(phase: number, r: number): string {
  const cx = r
  const cy = r
  const top = `${cx} ${cy - r}`
  const bottom = `${cx} ${cy + r}`

  if (phase < 0.5) {
    const rx = r * Math.cos(2 * Math.PI * phase)
    const sweep = rx > 0 ? 0 : 1
    return `M ${top} A ${r} ${r} 0 0 1 ${bottom} A ${Math.abs(rx)} ${r} 0 0 ${sweep} ${top} Z`
  }
  const rx2 = -r * Math.cos(2 * Math.PI * (phase - 0.5))
  const sweep2 = rx2 > 0 ? 1 : 0
  return `M ${top} A ${r} ${r} 0 0 0 ${bottom} A ${Math.abs(rx2)} ${r} 0 0 ${sweep2} ${top} Z`
}
