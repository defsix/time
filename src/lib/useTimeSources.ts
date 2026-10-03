import { useCallback, useEffect, useRef, useState } from 'react'
import { TIME_SOURCE_DEFS, computeConsensusOffset, measureAllSources, type TimeSourceResult } from './timeSources'

const RESYNC_INTERVAL_MS = 90_000

function initialResults(): TimeSourceResult[] {
  return TIME_SOURCE_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    url: def.url,
    method: def.method,
    protocol: def.protocol,
    description: def.description,
    status: 'pending',
    latencyMs: null,
    offsetMs: null,
    raw: null,
    error: null,
    measuredAt: null,
    httpStatus: null,
    contentType: null,
    sizeBytes: null,
    timing: null,
  }))
}

export function useTimeSources() {
  const [results, setResults] = useState<TimeSourceResult[]>(initialResults)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const consensusOffsetRef = useRef<number | null>(null)
  const lastStartedRef = useRef(0)

  const resync = useCallback(async () => {
    lastStartedRef.current = Date.now()
    setResults(initialResults())
    const final = await measureAllSources((partial) => {
      setResults((prev) => prev.map((r) => (r.id === partial.id ? partial : r)))
    })
    consensusOffsetRef.current = computeConsensusOffset(final)
    setLastSyncedAt(Date.now())
  }, [])

  useEffect(() => {
    resync()
    // Each re-check is three third-party requests, so skip them while the
    // page is hidden (a background tab, or the app in the background —
    // battery and mobile data for numbers nobody sees), and catch up as soon
    // as it's visible again if one is due.
    const isVisible = () => document.visibilityState === 'visible'
    const interval = setInterval(() => {
      if (isVisible()) resync()
    }, RESYNC_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (isVisible() && Date.now() - lastStartedRef.current >= RESYNC_INTERVAL_MS) resync()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [resync])

  // Corrected "now" = device clock adjusted by the consensus offset from network sources.
  const correctedNow = useCallback((): Date => {
    const offset = consensusOffsetRef.current
    return new Date(Date.now() - (offset !== null && Number.isFinite(offset) ? offset : 0))
  }, [])

  const consensusOffset = consensusOffsetRef.current

  return { results, resync, lastSyncedAt, correctedNow, consensusOffset }
}
