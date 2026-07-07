import { useEffect, useState } from 'react'
import Globe, { type FlyToRequest } from './components/Globe'
import ClockCard from './components/ClockCard'
import TimeSourcesPanel from './components/TimeSourcesPanel'
import CitySearch from './components/CitySearch'
import ThemeToggle from './components/ThemeToggle'
import { useTimeSources } from './lib/useTimeSources'
import { useTheme } from './lib/useTheme'
import { approxSolarOffsetHours } from './lib/geo'
import { findNearestCity } from './lib/allCities'
import type { City } from './lib/cities'
import './App.css'

type Selection = { kind: 'city'; city: City } | { kind: 'point'; lat: number; lon: number } | null

export default function App() {
  const { results, resync, lastSyncedAt, correctedNow, consensusOffset } = useTimeSources()
  const { choice: themeChoice, setChoice: setThemeChoice } = useTheme()
  const [now, setNow] = useState(() => correctedNow())
  const [selection, setSelection] = useState<Selection>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')
  const [flyToRequest, setFlyToRequest] = useState<FlyToRequest | null>(null)

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  function selectCity(city: City, fly: boolean) {
    setSelection({ kind: 'city', city })
    if (fly) setFlyToRequest({ city, nonce: Date.now() })
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(correctedNow()), 1000)
    return () => clearInterval(interval)
  }, [correctedNow])

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setUserLocation({ lat, lon })
        setGeoStatus('granted')
        // Default the second card + globe to the nearest known city so there's
        // something relevant to look at before the user searches for anything.
        const nearest = findNearestCity(lat, lon)
        if (nearest) selectCity(nearest, true)
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedTimeZone = selection?.kind === 'city' ? selection.city.tz : undefined
  const selectedSolarOffset =
    selection?.kind === 'point' ? approxSolarOffsetHours(selection.lon) : undefined

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>World Time</h1>
          <p>A Live World Clock, click any city to see its time.</p>
        </div>
        <ThemeToggle choice={themeChoice} onChange={setThemeChoice} />
      </header>

      <main className="app-main">
        <section className="globe-section">
          <Globe
            onSelectCity={(city) => selectCity(city, false)}
            onSelectPoint={(lat, lon) => setSelection({ kind: 'point', lat, lon })}
            selectedCityName={selection?.kind === 'city' ? selection.city.name : null}
            userLocation={userLocation}
            flyToRequest={flyToRequest}
          />
          <div className="globe-hint">
            Drag to rotate · scroll to zoom · click an amber marker for a city, or click anywhere else on the
            globe for an approximate local time
          </div>
          <CitySearch onSelectCity={(city) => selectCity(city, true)} />
        </section>

        <section className="panels-section">
          <ClockCard
            title="Your Location"
            subtitle={`${userTimeZone}${geoStatus === 'denied' ? ' (location permission denied — using browser time zone only)' : geoStatus === 'unsupported' ? ' (geolocation unsupported — using browser time zone)' : ''}`}
            now={now}
            timeZone={userTimeZone}
            accent="user"
          />

          {selection && (
            <ClockCard
              title={selection.kind === 'city' ? `${selection.city.name}, ${selection.city.country}` : 'Selected Point'}
              subtitle={
                selection.kind === 'city'
                  ? selection.city.tz
                  : `${selection.lat.toFixed(2)}°, ${selection.lon.toFixed(2)}°`
              }
              now={now}
              timeZone={selectedTimeZone}
              solarOffsetHours={selectedSolarOffset}
              accent="selection"
            />
          )}

          <TimeSourcesPanel
            results={results}
            consensusOffset={consensusOffset}
            lastSyncedAt={lastSyncedAt}
            onResync={resync}
          />
        </section>
      </main>

      <footer className="app-footer">
        Built with Three.js. Time cross-checked against WorldTimeAPI, TimeAPI.io, and an unrelated satellite-tracking
        API's server clock — see the Time Sources panel for live tech details on each.
      </footer>
    </div>
  )
}
