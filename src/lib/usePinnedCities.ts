import { useCallback, useEffect, useState } from 'react'
import type { City } from './cities'
import { readStorage, writeStorage } from './storage'
import { isValidTimeZone } from './timeZone'

const STORAGE_KEY = 'globe-time-pinned-cities'
const MAX_PINNED = 8

function keyFor(city: City): string {
  return `${city.name}|${city.country}`
}

function isStoredCity(value: unknown): value is City {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  return (
    typeof c.name === 'string' &&
    typeof c.country === 'string' &&
    typeof c.lat === 'number' &&
    Number.isFinite(c.lat) &&
    typeof c.lon === 'number' &&
    Number.isFinite(c.lon) &&
    typeof c.tz === 'string' &&
    isValidTimeZone(c.tz)
  )
}

/**
 * Stored pins are rendered on every load, so a malformed entry (an older
 * schema, a zone this browser doesn't know, hand-edited storage) is dropped
 * here rather than crashing the page each time it opens.
 */
export function parseStoredPinned(raw: string | null): City[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isStoredCity).slice(0, MAX_PINNED) : []
  } catch {
    return []
  }
}

export function usePinnedCities() {
  const [pinned, setPinned] = useState<City[]>(() => parseStoredPinned(readStorage(STORAGE_KEY)))

  useEffect(() => {
    writeStorage(STORAGE_KEY, JSON.stringify(pinned))
  }, [pinned])

  const isPinned = useCallback((city: City) => pinned.some((c) => keyFor(c) === keyFor(city)), [pinned])

  const togglePin = useCallback((city: City) => {
    setPinned((prev) => {
      if (prev.some((c) => keyFor(c) === keyFor(city))) return prev.filter((c) => keyFor(c) !== keyFor(city))
      if (prev.length >= MAX_PINNED) return prev
      return [...prev, city]
    })
  }, [])

  const removePin = useCallback((city: City) => {
    setPinned((prev) => prev.filter((c) => keyFor(c) !== keyFor(city)))
  }, [])

  return { pinned, isPinned, togglePin, removePin, maxPinned: MAX_PINNED }
}
