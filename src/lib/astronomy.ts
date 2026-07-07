// Client-side solar and lunar position formulas — no network dependency, so
// these never show a loading/error state. Sunrise/sunset uses the standard
// "sunrise equation" (see e.g. https://en.wikipedia.org/wiki/Sunrise_equation
// and https://aa.quae.nl/en/reken/zonpositie.html), accurate to roughly a
// minute. Moon phase uses a fixed-synodic-month approximation referenced to a
// known new moon, accurate to within a few hours — plenty for a phase name
// and illumination percentage.

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
