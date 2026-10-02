import { describe, expect, it } from 'vitest'
import { parseStoredPinned } from './usePinnedCities'

const tokyo = { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' }

describe('parseStoredPinned', () => {
  it('round-trips valid cities', () => {
    expect(parseStoredPinned(JSON.stringify([tokyo]))).toEqual([tokyo])
  })

  it('drops malformed entries instead of crashing on every load', () => {
    const stored = JSON.stringify([null, 42, { name: 'No tz' }, { ...tokyo, tz: 'Foo/Bar' }, { ...tokyo, lat: 'x' }, tokyo])
    expect(parseStoredPinned(stored)).toEqual([tokyo])
  })

  it('treats missing, non-array and corrupt JSON as no pins', () => {
    expect(parseStoredPinned(null)).toEqual([])
    expect(parseStoredPinned('{"a":1}')).toEqual([])
    expect(parseStoredPinned('[{')).toEqual([])
  })

  it('caps the list at the pin limit', () => {
    expect(parseStoredPinned(JSON.stringify(Array(20).fill(tokyo)))).toHaveLength(8)
  })
})
