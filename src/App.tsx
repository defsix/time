import { useEffect, useState } from 'react'
import Globe from './components/Globe'
import ClockCard from './components/ClockCard'
import TimeSourcesPanel from './components/TimeSourcesPanel'
import CitySearch from './components/CitySearch'
import { useTimeSources } from './lib/useTimeSources'
import { approxSolarOffsetHours } from './lib/geo'
import type { City } from './lib/cities'
import './App.css'

type Selection = { kind: 'city'; city: City } | { kind: 'point'; lat: number; lon: number } | null

export default function App() {
  const { results, resync, lastSyncedAt, correctedNow, consensusOffset } = useTimeSources()
  const [now, setNow] = useState(() => correctedNow())
  const [selection, setSelection] = useState<Selection>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

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
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoStatus('granted')
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 },
    )
  }, [])

  const selectedTimeZone = selection?.kind === 'city' ? selection.city.tz : undefined
  const selectedSolarOffset =
    selection?.kind === 'point' ? approxSolarOffsetHours(selection.lon) : undefined

  return (
    <div className="app">
      <header className="app-header">
        <h1>Globe Time</h1>
        <p>Live world clock with a wireframe globe, click any city to see its time.</p>
      </header>

      <main className="app-main">
        <section className="globe-section">
          <Globe
            onSelectCity={(city) => setSelection({ kind: 'city', city })}
            onSelectPoint={(lat, lon) => setSelection({ kind: 'point', lat, lon })}
            selectedCityName={selection?.kind === 'city' ? selection.city.name : null}
            userLocation={userLocation}
          />
          <div className="globe-hint">
            Drag to rotate · scroll to zoom · click an amber marker for a city, or click anywhere else on the
            globe for an approximate local time
          </div>
          <CitySearch onSelectCity={(city) => setSelection({ kind: 'city', city })} />
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
        Built with Three.js. Time cross-checked against WorldTimeAPI, TimeAPI.io, Cloudflare's edge network, and
        a JSON time service — see the Time Sources panel for live tech details on each.
      </footer>
    </div>
  )
}
