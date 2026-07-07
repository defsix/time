// Multi-source time synchronization.
//
// Each source is fetched independently over HTTPS. We measure round-trip
// latency with performance.now() and estimate the source's clock at the
// moment the response arrived using the NTP-style midpoint assumption
// (network latency there ~= network latency back), then diff that against
// the device clock to get an offset. Sources fail independently so one
// dead API never blocks the others.

export type SourceStatus = 'pending' | 'ok' | 'error'

export interface TimingBreakdown {
  dnsMs: number
  connectMs: number
  ttfbMs: number
  downloadMs: number
}

export interface TimeSourceDef {
  id: string
  name: string
  url: string
  method: string
  protocol: string
  description: string
  parse: (body: string, headers: Headers) => number // returns ms since epoch
}

export interface TimeSourceResult {
  id: string
  name: string
  url: string
  method: string
  protocol: string
  description: string
  status: SourceStatus
  latencyMs: number | null
  offsetMs: number | null // localClock - sourceClock, at moment of measurement
  raw: string | null
  error: string | null
  measuredAt: number | null // performance.now() timestamp of measurement
  httpStatus: number | null
  contentType: string | null
  sizeBytes: number | null
  timing: TimingBreakdown | null // best-effort; browsers redact this for most cross-origin responses
}

export const TIME_SOURCE_DEFS: TimeSourceDef[] = [
  {
    id: 'device',
    name: 'Device System Clock',
    url: '(local)',
    method: 'Date.now()',
    protocol: 'OS clock, usually NTP-disciplined by your device/router',
    description:
      'Your computer or phone’s own clock. Modern OSes sync this via NTP/NTS in the background, so it is normally accurate to within milliseconds, but it can drift if the device has been offline a long time.',
    parse: () => Date.now(),
  },
  {
    id: 'worldtimeapi',
    name: 'WorldTimeAPI',
    url: 'https://worldtimeapi.org/api/timezone/Etc/UTC',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST, server time backed by NTP',
    description:
      'Public REST API that returns the current UTC time as JSON, including the unix timestamp. The service itself keeps its clock disciplined via NTP.',
    parse: (body) => {
      const data = JSON.parse(body) as { unixtime?: number; utc_datetime?: string }
      if (typeof data.unixtime === 'number') return data.unixtime * 1000
      if (data.utc_datetime) return new Date(data.utc_datetime).getTime()
      throw new Error('unexpected payload')
    },
  },
  {
    id: 'timeapi_io',
    name: 'TimeAPI.io',
    url: 'https://timeapi.io/api/Time/current/zone?timeZone=Etc/UTC',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST',
    description:
      'Independent third-party time REST API used here as a cross-check against WorldTimeAPI, so a single provider’s outage or drift cannot silently skew the displayed time.',
    parse: (body) => {
      const data = JSON.parse(body) as {
        year: number; month: number; day: number
        hour: number; minute: number; seconds: number; milliSeconds: number
      }
      return Date.UTC(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds, data.milliSeconds)
    },
  },
  {
    id: 'iss-now',
    name: 'Where The ISS At (satellite tracker)',
    url: 'https://api.wheretheiss.at/v1/satellites/25544',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST, unrelated third-party service',
    description:
      'Not a time API at all — a public satellite-tracking service that stamps every response with the current Unix time it used to compute the ISS’s position. Used here purely as an independent server clock with no shared infrastructure with the time-specific APIs above (only second-level precision, so expect a larger offset spread than the others).',
    parse: (body) => {
      const data = JSON.parse(body) as { timestamp?: number }
      if (typeof data.timestamp !== 'number') throw new Error('unexpected payload')
      return data.timestamp * 1000
    },
  },
  {
    id: 'open-notify',
    name: 'Open Notify (ISS tracker)',
    url: 'https://api.open-notify.org/iss-now.json',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST, unrelated third-party service on separate infrastructure from the ISS source above',
    description:
      'The same borrowed-timestamp trick as Where The ISS At, but a completely separate hobby-run service (open-notify.org) tracking the same satellite independently — different maintainer, different servers, different codebase. A sixth data point that shares nothing with any other source here except the fact that both happen to track the ISS (second-level precision).',
    parse: (body) => {
      const data = JSON.parse(body) as { timestamp?: number }
      if (typeof data.timestamp !== 'number') throw new Error('unexpected payload')
      return data.timestamp * 1000
    },
  },
]

function extractTimingBreakdown(url: string, sinceTime: number): TimingBreakdown | null {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const candidates = entries.filter((e) => e.name === url && e.startTime >= sinceTime - 50)
  const entry = candidates[candidates.length - 1]
  if (!entry) return null
  // Cross-origin responses without a Timing-Allow-Origin header have most phase
  // timings zeroed out by the browser for privacy — only surface this when the
  // server actually opted in and gave us something real to show.
  if (entry.connectEnd === 0 && entry.domainLookupEnd === 0 && entry.responseStart === 0) return null
  return {
    dnsMs: Math.max(0, entry.domainLookupEnd - entry.domainLookupStart),
    connectMs: Math.max(0, entry.connectEnd - entry.connectStart),
    ttfbMs: Math.max(0, entry.responseStart - entry.requestStart),
    downloadMs: Math.max(0, entry.responseEnd - entry.responseStart),
  }
}

async function measureSource(def: TimeSourceDef): Promise<TimeSourceResult> {
  const base: TimeSourceResult = {
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
  }

  if (def.id === 'device') {
    return { ...base, status: 'ok', latencyMs: 0, offsetMs: 0, raw: new Date().toISOString(), measuredAt: performance.now() }
  }

  const REQUEST_TIMEOUT_MS = 9000
  const MAX_ATTEMPTS = 2 // real-world mobile networks routinely drop or stall one attempt in a row

  let lastError: unknown = null
  let lastLatency = 0
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const t0 = performance.now()
    try {
      const res = await fetch(def.url, { signal: controller.signal, cache: 'no-store' })
      const t1 = performance.now()
      const body = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const sourceMs = def.parse(body, res.headers)
      const roundTrip = t1 - t0
      const estimatedSourceNowAtT1 = sourceMs + roundTrip / 2
      const localNowAtT1 = Date.now()
      const offsetMs = localNowAtT1 - estimatedSourceNowAtT1
      return {
        ...base,
        status: 'ok',
        latencyMs: Math.round(roundTrip),
        offsetMs: Math.round(offsetMs),
        raw: body.slice(0, 400),
        measuredAt: t1,
        httpStatus: res.status,
        contentType: res.headers.get('content-type'),
        sizeBytes: new Blob([body]).size,
        timing: extractTimingBreakdown(def.url, t0),
      }
    } catch (err) {
      lastError = err
      lastLatency = performance.now() - t0
      if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 400))
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    ...base,
    status: 'error',
    error: lastError instanceof Error ? lastError.message : String(lastError),
    latencyMs: Math.round(lastLatency),
  }
}

export async function measureAllSources(
  onUpdate: (result: TimeSourceResult) => void,
): Promise<TimeSourceResult[]> {
  const results = await Promise.all(
    TIME_SOURCE_DEFS.map(async (def) => {
      const result = await measureSource(def)
      onUpdate(result)
      return result
    }),
  )
  return results
}

// Median offset across all successfully-measured network sources (device excluded),
// so one noisy/slow API can't single-handedly skew the corrected clock.
export function computeConsensusOffset(results: TimeSourceResult[]): number | null {
  const offsets = results
    .filter((r) => r.status === 'ok' && r.id !== 'device' && r.offsetMs !== null)
    .map((r) => r.offsetMs as number)
  if (offsets.length === 0) return null
  offsets.sort((a, b) => a - b)
  const mid = Math.floor(offsets.length / 2)
  return offsets.length % 2 === 0 ? (offsets[mid - 1] + offsets[mid]) / 2 : offsets[mid]
}
