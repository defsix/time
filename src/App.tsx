import { useEffect, useRef, useState } from 'react'
import Globe, { type FlyToRequest } from './components/Globe'
import ClockCard from './components/ClockCard'
import TimeSourcesPanel from './components/TimeSourcesPanel'
import CitySearch from './components/CitySearch'
import ThemeToggle from './components/ThemeToggle'
import HourFormatToggle from './components/HourFormatToggle'
import CopyLinkButton from './components/CopyLinkButton'
import PinnedCitiesStrip from './components/PinnedCitiesStrip'
import { useTimeSources } from './lib/useTimeSources'
import { useTheme } from './lib/useTheme'
import { useHourFormat } from './lib/useHourFormat'
import { usePinnedCities } from './lib/usePinnedCities'
import { approxSolarOffsetHours } from './lib/geo'
import { findNearestCity } from './lib/allCities'
import { readShareParamsFromURL, writeShareParamsToURL } from './lib/shareLink'
import type { City } from './lib/cities'
import './App.css'

type Selection = { kind: 'city'; city: City } | { kind: 'point'; lat: number; lon: number } | null

function selectionFromShareParams(): Selection {
  const shared = readShareParamsFromURL()
  if (!shared) return null
  if (shared.name && shared.tz) {
    return { kind: 'city', city: { name: shared.name, country: shared.country ?? '', lat: shared.lat, lon: shared.lon, tz: shared.tz } }
  }
  return { kind: 'point', lat: shared.lat, lon: shared.lon }
}

export default function App() {
  const { results, resync, lastSyncedAt, correctedNow, consensusOffset } = useTimeSources()
  const { choice: themeChoice, setChoice: setThemeChoice } = useTheme()
  const { choice: hourFormatChoice, hour12, setChoice: setHourFormatChoice } = useHourFormat()
  const { pinned, isPinned, togglePin, removePin } = usePinnedCities()
  const [now, setNow] = useState(() => correctedNow())
  const [selection, setSelection] = useState<Selection>(() => selectionFromShareParams())
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')
  const [flyToRequest, setFlyToRequest] = useState<FlyToRequest | null>(() => {
    const initial = selectionFromShareParams()
    return initial?.kind === 'city' ? { city: initial.city, nonce: Date.now() } : null
  })
  const hasSharedSelectionRef = useRef(selection !== null)

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
        // something relevant to look at before the user searches for anything
        // — unless a shared link already picked a selection, which wins.
        if (hasSharedSelectionRef.current) return
        findNearestCity(lat, lon).then((nearest) => {
          if (nearest && !hasSharedSelectionRef.current) selectCity(nearest, true)
        })
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the URL in sync with the current selection so it can be copied/shared.
  useEffect(() => {
    if (!selection) {
      writeShareParamsToURL(null)
    } else if (selection.kind === 'city') {
      writeShareParamsToURL({
        lat: selection.city.lat,
        lon: selection.city.lon,
        name: selection.city.name,
        country: selection.city.country,
        tz: selection.city.tz,
      })
    } else {
      writeShareParamsToURL({ lat: selection.lat, lon: selection.lon })
    }
  }, [selection])

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
        <div className="header-toggles">
          <HourFormatToggle choice={hourFormatChoice} onChange={setHourFormatChoice} />
          <ThemeToggle choice={themeChoice} onChange={setThemeChoice} />
        </div>
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
            Drag to rotate · scroll to zoom · tap near a marker for a city, or tap anywhere else on the globe
            for an approximate local time
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
            hour12={hour12}
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
              hour12={hour12}
              headerExtra={
                <>
                  {selection.kind === 'city' && (
                    <button
                      className={`clock-card-icon-btn ${isPinned(selection.city) ? 'active' : ''}`}
                      onClick={() => togglePin(selection.city)}
                    >
                      {isPinned(selection.city) ? 'Pinned' : 'Pin'}
                    </button>
                  )}
                  <CopyLinkButton />
                </>
              }
            />
          )}

          {pinned.length > 0 && (
            <PinnedCitiesStrip
              cities={pinned}
              now={now}
              hour12={hour12}
              onSelect={(city) => selectCity(city, true)}
              onRemove={removePin}
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
