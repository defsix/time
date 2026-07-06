// Multi-source time synchronization.
//
// Each source is fetched independently over HTTPS. We measure round-trip
// latency with performance.now() and estimate the source's clock at the
// moment the response arrived using the NTP-style midpoint assumption
// (network latency there ~= network latency back), then diff that against
// the device clock to get an offset. Sources fail independently so one
// dead API never blocks the others.

export type SourceStatus = 'pending' | 'ok' | 'error'

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
    id: 'cloudflare',
    name: 'Cloudflare Edge (cdn-cgi/trace)',
    url: 'https://cloudflare.com/cdn-cgi/trace',
    method: 'GET (text)',
    protocol: 'HTTPS, answered by nearest Cloudflare anycast edge node',
    description:
      'Cloudflare’s edge diagnostic endpoint echoes back the request timestamp (“ts”) from whichever edge datacenter is nearest to you via anycast routing — a fast, high-availability, NTP-synced reference clock.',
    parse: (body) => {
      const match = body.match(/ts=([0-9.]+)/)
      if (!match) throw new Error('no ts field')
      return parseFloat(match[1]) * 1000
    },
  },
  {
    id: 'jsontest',
    name: 'JSONTest date service',
    url: 'https://date.jsontest.com',
    method: 'GET (JSON)',
    protocol: 'HTTPS REST, independent backend/host from the sources above',
    description:
      'A lightweight independent JSON time endpoint on its own infrastructure — a fourth, unrelated data point so the consensus clock isn’t relying on providers that might share upstream infra.',
    parse: (body) => {
      const data = JSON.parse(body) as { milliseconds_since_epoch?: number }
      if (typeof data.milliseconds_since_epoch !== 'number') throw new Error('unexpected payload')
      return data.milliseconds_since_epoch
    },
  },
]

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
  }

  if (def.id === 'device') {
    return { ...base, status: 'ok', latencyMs: 0, offsetMs: 0, raw: new Date().toISOString(), measuredAt: performance.now() }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
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
    }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Math.round(performance.now() - t0),
    }
  } finally {
    clearTimeout(timeout)
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
