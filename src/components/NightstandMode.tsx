import { useEffect, useState } from 'react'
import Globe from './Globe'
import type { City } from '../lib/cities'
import { listCityAlarms, type CityAlarm } from '../lib/nativeBridge'
import { useWakeLock } from '../lib/useWakeLock'

// OrbitControls unit: seconds per revolution at 60fps = 60 / speed.
// 60 / 0.1 = 600s = one revolution per 10 minutes.
const NIGHTSTAND_ROTATE_SPEED = 0.1

interface NightstandModeProps {
  now: Date
  timeZone?: string
  label: string
  hour12: boolean
  selectedCityName: string | null
  userLocation: { lat: number; lon: number } | null
  pinnedCities: City[]
  onExit: () => void
}

function timeAt(now: Date, timeZone: string, hour12: boolean): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12 }).format(now)
}

export default function NightstandMode({
  now,
  timeZone,
  label,
  hour12,
  selectedCityName,
  userLocation,
  pinnedCities,
  onExit,
}: NightstandModeProps) {
  useWakeLock(true)
  const [alarms, setAlarms] = useState<CityAlarm[]>([])

  useEffect(() => {
    let cancelled = false
    async function refresh() {
      const list = await listCityAlarms()
      if (!cancelled) setAlarms(list)
    }
    refresh()
    const interval = setInterval(refresh, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const time = timeAt(now, timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, hour12)
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)

  return (
    <div className="nightstand" onClick={onExit} role="button" tabIndex={0} aria-label="Exit nightstand mode">
      <div className="nightstand-globe-layer">
        <Globe
          onSelectCity={() => {}}
          onSelectPoint={() => {}}
          selectedCityName={selectedCityName}
          userLocation={userLocation}
          flyToRequest={null}
          forceAutoRotate
          autoRotateSpeed={NIGHTSTAND_ROTATE_SPEED}
        />
      </div>

      <div className="nightstand-overlay">
        <div className="nightstand-time">{time}</div>
        <div className="nightstand-date">{date}</div>
        <div className="nightstand-label">{label}</div>

        {pinnedCities.length > 0 && (
          <div className="nightstand-pinned">
            {pinnedCities.map((city) => (
              <div key={`${city.name}-${city.country}`} className="nightstand-row">
                <span className="nightstand-row-name">{city.name}</span>
                <span className="nightstand-row-time">{timeAt(now, city.tz, hour12)}</span>
              </div>
            ))}
          </div>
        )}

        {alarms.length > 0 && (
          <div className="nightstand-alarms">
            {alarms
              .slice()
              .sort((a, b) => a.epochMillis - b.epochMillis)
              .map((alarm) => (
                <div key={alarm.id} className="nightstand-row">
                  <span className="nightstand-row-name">⏰ {alarm.label}</span>
                  <span className="nightstand-row-time">
                    {new Intl.DateTimeFormat('en-US', {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12,
                    }).format(new Date(alarm.epochMillis))}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="nightstand-hint">Tap anywhere to exit</div>
    </div>
  )
}
