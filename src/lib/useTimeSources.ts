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

  const resync = useCallback(async () => {
    setResults(initialResults())
    const final = await measureAllSources((partial) => {
      setResults((prev) => prev.map((r) => (r.id === partial.id ? partial : r)))
    })
    consensusOffsetRef.current = computeConsensusOffset(final)
    setLastSyncedAt(Date.now())
  }, [])

  useEffect(() => {
    resync()
    const interval = setInterval(resync, RESYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [resync])

  // Corrected "now" = device clock adjusted by the consensus offset from network sources.
  const correctedNow = useCallback((): Date => {
    const offset = consensusOffsetRef.current ?? 0
    return new Date(Date.now() - offset)
  }, [])

  const consensusOffset = consensusOffsetRef.current

  return { results, resync, lastSyncedAt, correctedNow, consensusOffset }
}
