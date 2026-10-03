import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeConsensusOffset, isPlausibleSourceTime, measureAllSources, type TimeSourceResult } from './timeSources'

function okResult(id: string, offsetMs: number): TimeSourceResult {
  return {
    id, name: id, url: '', method: '', protocol: '', description: '',
    status: 'ok', latencyMs: 0, offsetMs, raw: null, error: null, measuredAt: 0,
    httpStatus: 200, contentType: null, sizeBytes: null, timing: null,
  }
}

describe('isPlausibleSourceTime', () => {
  it('accepts a current timestamp and rejects garbage', () => {
    expect(isPlausibleSourceTime(Date.now())).toBe(true)
    expect(isPlausibleSourceTime(NaN)).toBe(false)
    expect(isPlausibleSourceTime(0)).toBe(false) // e.g. a missing field defaulting to 0
    expect(isPlausibleSourceTime(Date.now() / 1000)).toBe(false) // seconds mistaken for ms
    expect(isPlausibleSourceTime(Date.now() * 1000)).toBe(false) // µs mistaken for ms
  })
})

describe('computeConsensusOffset', () => {
  it('takes the median of network sources, ignoring the device clock', () => {
    expect(computeConsensusOffset([okResult('device', 0), okResult('a', 100), okResult('b', 300), okResult('c', 200)])).toBe(200)
  })

  it('never lets a non-finite offset through (it used to make every clock an Invalid Date)', () => {
    expect(computeConsensusOffset([okResult('a', NaN), okResult('b', 120)])).toBe(120)
    expect(computeConsensusOffset([okResult('a', NaN)])).toBeNull()
  })
})

describe('measureAllSources', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fails a source whose payload parses to an unusable time, and the consensus stays finite', async () => {
    // The scenario from the review: Binance geo-blocked (HTTP 451, as for US
    // users) and TimeAPI.io returning a 200 with an unexpected body.
    const now = Date.now()
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('timeapi.io')) return new Response('{}', { status: 200 })
      if (url.includes('binance')) return new Response('restricted', { status: 451 })
      return new Response(JSON.stringify({ unixtime: Math.floor(now / 1000) }), { status: 200 })
    })

    const results = await measureAllSources(() => {})
    const byId = Object.fromEntries(results.map((r) => [r.id, r]))
    expect(byId.timeapi_io).toMatchObject({ status: 'error', error: 'unexpected payload' })
    expect(byId['binance-time']).toMatchObject({ status: 'error', error: 'HTTP 451' })
    expect(byId['time-now'].status).toBe('ok')

    const consensus = computeConsensusOffset(results)
    expect(Number.isFinite(consensus)).toBe(true)
    expect(Math.abs(consensus as number)).toBeLessThan(2000) // time.now's whole-second resolution
  })
})
