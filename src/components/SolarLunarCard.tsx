import { getSunTimes, getMoonPhase, moonPhasePathD } from '../lib/astronomy'
import { t } from '../lib/i18n'

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
  return new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12 }).format(date)
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
        <span className="clock-card-title">{t.solarLunar.title}</span>
        <span className="clock-card-offset">{location ? location.label : t.solarLunar.locationIndependent}</span>
      </div>
      <div className="solar-lunar-grid">
        <div className="solar-block">
          {!location && <div className="sun-note">{t.solarLunar.selectCityNote}</div>}
          {location && sun && sun.alwaysDay && <div className="sun-note">{t.solarLunar.polarDay}</div>}
          {location && sun && sun.alwaysNight && <div className="sun-note">{t.solarLunar.polarNight}</div>}
          {location && sun && !sun.alwaysDay && !sun.alwaysNight && sun.sunrise && sun.sunset && (
            <>
              <div className="sun-row">
                <span>{t.solarLunar.sunrise}</span>
                <strong>{formatTime(sun.sunrise, location.tz, hour12)}</strong>
              </div>
              <div className="sun-row">
                <span>{t.solarLunar.sunset}</span>
                <strong>{formatTime(sun.sunset, location.tz, hour12)}</strong>
              </div>
              <div className="sun-row">
                <span>{t.solarLunar.solarNoon}</span>
                <strong>{formatTime(sun.solarNoon, location.tz, hour12)}</strong>
              </div>
              <div className="sun-row">
                <span>{t.solarLunar.dayLength}</span>
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
            <strong>{t.moonPhases[moon.name]}</strong>
            <span>{t.solarLunar.illuminated(Math.round(moon.illumination * 100))}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
