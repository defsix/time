import { describe, expect, it } from 'vitest'
import { parseShareParams } from './shareLink'

describe('parseShareParams', () => {
  it('parses a normal city link', () => {
    expect(parseShareParams('?lat=35.6762&lon=139.6503&name=Tokyo&country=Japan&tz=Asia/Tokyo')).toEqual({
      lat: 35.6762,
      lon: 139.6503,
      name: 'Tokyo',
      country: 'Japan',
      tz: 'Asia/Tokyo',
    })
  })

  it('drops an unknown time zone instead of passing it on (it used to blank the page)', () => {
    expect(parseShareParams('?lat=1&lon=1&name=X&tz=Foo/Bar')?.tz).toBeUndefined()
  })

  it.each(['?lat=91&lon=0', '?lat=0&lon=-180.5', '?lat=abc&lon=0', '?lat=Infinity&lon=0', '?lon=0', ''])(
    'rejects missing or out-of-range coordinates: %s',
    (search) => {
      expect(parseShareParams(search)).toBeNull()
    },
  )

  it('trims and caps free-text labels, and treats blank ones as absent', () => {
    const parsed = parseShareParams(`?lat=0&lon=0&name=${'x'.repeat(500)}&country=%20%20`)
    expect(parsed?.name).toHaveLength(100)
    expect(parsed?.country).toBeUndefined()
  })
})
