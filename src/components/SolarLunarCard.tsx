import { getSunTimes, getMoonPhase, moonPhasePathD } from '../lib/astronomy'

interface LocationInfo {
  lat: number
  lon: number
  tz: string
  label: string
}

interface SolarLunarCardProps {
  now: Date
  location: LocationInfo | null
  hour12: boolean
}

function formatTime(date: Date, tz: string, hour12: boolean): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12 }).format(date)
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${m}m`
}

const MOON_ICON_R = 20

export default function SolarLunarCard({ now, location, hour12 }: SolarLunarCardProps) {
  const moon = getMoonPhase(now)
  const moonPath = moonPhasePathD(moon.phase, MOON_ICON_R)
  const sun = location ? getSunTimes(now, location.lat, location.lon) : null

  return (
    <div className="solar-lunar-card">
      <div className="clock-card-header">
        <span className="clock-card-title">Sun &amp; Moon</span>
        <span className="clock-card-offset">{location ? location.label : 'Moon phase is location-independent'}</span>
      </div>
      <div className="solar-lunar-grid">
        <div className="solar-block">
          {!location && (
            <div className="sun-note">Select a city, or allow location access, to see sunrise &amp; sunset times here.</div>
          )}
          {location && sun && sun.alwaysDay && <div className="sun-note">The sun does not set today at this location (polar day).</div>}
          {location && sun && sun.alwaysNight && <div className="sun-note">The sun does not rise today at this location (polar night).</div>}
          {location && sun && !sun.alwaysDay && !sun.alwaysNight && sun.sunrise && sun.sunset && (
            <>
              <div className="sun-row">
                <span>Sunrise</span>
                <strong>{formatTime(sun.sunrise, location.tz, hour12)}</strong>
              </div>
              <div className="sun-row">
                <span>Sunset</span>
                <strong>{formatTime(sun.sunset, location.tz, hour12)}</strong>
              </div>
              <div className="sun-row">
                <span>Solar noon</span>
                <strong>{formatTime(sun.solarNoon, location.tz, hour12)}</strong>
              </div>
              <div className="sun-row">
                <span>Day length</span>
                <strong>{formatDuration(sun.dayLengthMinutes ?? 0)}</strong>
              </div>
            </>
          )}
        </div>
        <div className="moon-block">
          <svg viewBox={`0 0 ${MOON_ICON_R * 2} ${MOON_ICON_R * 2}`} width="44" height="44" className="moon-icon">
            <circle cx={MOON_ICON_R} cy={MOON_ICON_R} r={MOON_ICON_R - 1} className="moon-icon-dark" />
            <path d={moonPath} className="moon-icon-light" />
            <circle cx={MOON_ICON_R} cy={MOON_ICON_R} r={MOON_ICON_R - 1} className="moon-icon-outline" fill="none" />
          </svg>
          <div className="moon-info">
            <strong>{moon.name}</strong>
            <span>{Math.round(moon.illumination * 100)}% illuminated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
