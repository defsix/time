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
    id: 'timeapi_io',
    name: 'TimeAPI.io',
    url: 'https://timeapi.io/api/Time/current/zone?timeZone=Etc/UTC',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST',
    description:
      'A dedicated third-party time REST API, kept as the anchor time-specific source in the lineup.',
    parse: (body) => {
      const data = JSON.parse(body) as {
        year: number; month: number; day: number
        hour: number; minute: number; seconds: number; milliSeconds: number
      }
      return Date.UTC(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds, data.milliSeconds)
    },
  },
  {
    id: 'binance-time',
    name: 'Binance server time',
    url: 'https://api.binance.com/api/v3/time',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST, financial exchange infrastructure',
    description:
      'Not a time API at all — a global crypto exchange’s clock-sync endpoint, published specifically so trading clients can detect drift before their signed API requests get rejected. Millisecond precision and run on infrastructure with a strong uptime incentive, since a lot of live trading depends on it.',
    parse: (body) => {
      const data = JSON.parse(body) as { serverTime?: number }
      if (typeof data.serverTime !== 'number') throw new Error('unexpected payload')
      return data.serverTime
    },
  },
  {
    id: 'coinbase-time',
    name: 'Coinbase server time',
    url: 'https://api.coinbase.com/v2/time',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST, financial exchange infrastructure, unrelated to the source above',
    description:
      'The same idea as the Binance source — a major exchange’s dedicated clock-sync endpoint — but a completely separate company and infrastructure, used here purely as an independent, high-uptime reference clock (second-level precision).',
    parse: (body) => {
      const data = JSON.parse(body) as { data?: { epoch?: number } }
      if (typeof data.data?.epoch !== 'number') throw new Error('unexpected payload')
      return data.data.epoch * 1000
    },
  },
  {
    id: 'kraken-time',
    name: 'Kraken server time',
    url: 'https://api.kraken.com/0/public/Time',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST, financial exchange infrastructure, unrelated to the sources above',
    description:
      'A third exchange’s public clock-sync endpoint, on its own infrastructure independent of Binance and Coinbase — a fourth network data point (second-level precision) so the consensus doesn’t lean on any single company.',
    parse: (body) => {
      const data = JSON.parse(body) as { result?: { unixtime?: number } }
      if (typeof data.result?.unixtime !== 'number') throw new Error('unexpected payload')
      return data.result.unixtime * 1000
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
