import { useCallback, useEffect, useState } from 'react'
import type { City } from './cities'

const STORAGE_KEY = 'globe-time-pinned-cities'
const MAX_PINNED = 8

function keyFor(city: City): string {
  return `${city.name}|${city.country}`
}

function readStored(): City[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function usePinnedCities() {
  const [pinned, setPinned] = useState<City[]>(readStored)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned))
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
