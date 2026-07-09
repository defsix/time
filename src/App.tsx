import { useEffect, useRef, useState } from 'react'
import Globe, { type FlyToRequest } from './components/Globe'
import ClockCard from './components/ClockCard'
import TimeSourcesPanel from './components/TimeSourcesPanel'
import CitySearch from './components/CitySearch'
import ThemeToggle from './components/ThemeToggle'
import HourFormatToggle from './components/HourFormatToggle'
import CopyLinkButton from './components/CopyLinkButton'
import PinnedCitiesStrip from './components/PinnedCitiesStrip'
import SolarLunarCard from './components/SolarLunarCard'
import CityAlarms from './components/CityAlarms'
import NightstandMode from './components/NightstandMode'
import { isAlarmBridgeAvailable, setStatusBarAppearance } from './lib/nativeBridge'
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
  const { choice: themeChoice, effective: effectiveTheme, setChoice: setThemeChoice } = useTheme()
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
  const [nightstandMode, setNightstandMode] = useState(false)
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

  // Keep the native status bar's icon color legible against whatever the
  // page's actual background currently is — this is independent of the
  // device's own system dark/light mode, which is all the native Android
  // shell's default styling otherwise reacts to. Nightstand mode is always
  // a black background regardless of the app's theme choice.
  useEffect(() => {
    setStatusBarAppearance(!nightstandMode && effectiveTheme === 'light')
  }, [effectiveTheme, nightstandMode])

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

  const solarLunarLocation =
    selection?.kind === 'city'
      ? { lat: selection.city.lat, lon: selection.city.lon, tz: selection.city.tz, label: `${selection.city.name}, ${selection.city.country}` }
      : userLocation
        ? { lat: userLocation.lat, lon: userLocation.lon, tz: userTimeZone, label: 'Your Location' }
        : null

  if (nightstandMode) {
    return (
      <NightstandMode
        now={now}
        timeZone={selection?.kind === 'city' ? selection.city.tz : userTimeZone}
        label={selection?.kind === 'city' ? `${selection.city.name}, ${selection.city.country}` : 'Your Location'}
        hour12={hour12}
        selectedCityName={selection?.kind === 'city' ? selection.city.name : null}
        userLocation={userLocation}
        pinnedCities={pinned}
        onExit={() => setNightstandMode(false)}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>World Time</h1>
          <p>A Live World Clock, click any city to see its time.</p>
        </div>
        <div className="header-toggles">
          <button className="nightstand-toggle-btn" onClick={() => setNightstandMode(true)}>
            Nightstand
          </button>
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
            selectedPoint={selection?.kind === 'point' ? { lat: selection.lat, lon: selection.lon } : null}
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
            headerExtra={
              isAlarmBridgeAvailable() ? <CityAlarms targetTz={userTimeZone} targetLabel="Your Location" /> : undefined
            }
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
                  {selection.kind === 'city' && isAlarmBridgeAvailable() && (
                    <CityAlarms
                      targetTz={selection.city.tz}
                      targetLabel={`${selection.city.name}, ${selection.city.country}`}
                    />
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

          <SolarLunarCard now={now} location={solarLunarLocation} hour12={hour12} />

          <TimeSourcesPanel
            results={results}
            consensusOffset={consensusOffset}
            lastSyncedAt={lastSyncedAt}
            onResync={resync}
          />
        </section>
      </main>

      <footer className="app-footer">
        Built with Three.js. Time cross-checked against TimeAPI.io, Binance's clock-sync endpoint, and two
        independent WorldTimeAPI-compatible HTTP time services (timeapi.world, time.now) — see the Time Sources
        panel for live tech details on each. Sunrise, sunset, and moon phase are computed locally from standard
        solar/lunar position formulas.
      </footer>
    </div>
  )
}
