import { describe, expect, it } from 'vitest'
import { formatAlarmTime, nextOccurrenceEpoch } from './alarmTime'

/** "YYYY-MM-DD HH:MM" wall time of `epoch` in `timeZone`, for readable assertions. */
function wallTime(epoch: number, timeZone: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(new Date(epoch))
      .map((part) => [part.type, part.value]),
  )
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

describe('nextOccurrenceEpoch', () => {
  it('returns later today when the time has not passed yet', () => {
    const epoch = nextOccurrenceEpoch('Asia/Tokyo', 7, 0, new Date('2026-06-01T00:00:00Z')) // 09:00 in Tokyo
    expect(wallTime(epoch, 'Asia/Tokyo')).toBe('2026-06-02 07:00')
    expect(epoch).toBe(Date.parse('2026-06-01T22:00:00Z'))
  })

  it('rolls over to tomorrow, across a month/year boundary', () => {
    const epoch = nextOccurrenceEpoch('Europe/London', 6, 30, new Date('2026-12-31T12:00:00Z'))
    expect(wallTime(epoch, 'Europe/London')).toBe('2027-01-01 06:30')
  })

  it('handles half-hour offsets', () => {
    const epoch = nextOccurrenceEpoch('Asia/Kolkata', 8, 15, new Date('2026-06-01T00:00:00Z'))
    expect(epoch).toBe(Date.parse('2026-06-01T02:45:00Z'))
  })

  // Each case below fired an hour early or late before the DST fix.
  describe.each([
    // zone, "from" instant, hour, minute, expected local wall time
    ['America/New_York', '2026-03-08T00:00:00Z', 4, 0, '2026-03-08 04:00'], // spring forward (EST→EDT)
    ['America/New_York', '2026-11-01T00:00:00Z', 5, 0, '2026-11-01 05:00'], // fall back (EDT→EST)
    ['Europe/Berlin', '2026-03-28T22:00:00Z', 1, 30, '2026-03-29 01:30'], // spring forward (CET→CEST)
    ['Australia/Sydney', '2026-10-03T10:00:00Z', 1, 0, '2026-10-04 01:00'], // spring forward (AEST→AEDT)
    ['Australia/Sydney', '2026-04-04T10:00:00Z', 1, 0, '2026-04-05 01:00'], // fall back (AEDT→AEST)
  ])('on a DST transition day in %s (from %s)', (tz, from, hour, minute, expected) => {
    it(`rings at ${expected} local time`, () => {
      expect(wallTime(nextOccurrenceEpoch(tz, hour, minute, new Date(from)), tz)).toBe(expected)
    })
  })

  it('rings at the first occurrence of a repeated (fall-back) hour', () => {
    // 01:30 happens twice in New York on 2026-11-01: 05:30Z (EDT), then 06:30Z (EST).
    expect(nextOccurrenceEpoch('America/New_York', 1, 30, new Date('2026-11-01T00:00:00Z'))).toBe(
      Date.parse('2026-11-01T05:30:00Z'),
    )
    // Same in a zone east of UTC: 02:30 happens twice in Sydney on 2026-04-05.
    expect(nextOccurrenceEpoch('Australia/Sydney', 2, 30, new Date('2026-04-04T10:00:00Z'))).toBe(
      Date.parse('2026-04-04T15:30:00Z'),
    )
  })

  it('shifts a skipped (spring-forward) time later by the gap', () => {
    // 02:30 doesn't exist in New York on 2026-03-08; ring at 03:30 EDT instead.
    const epoch = nextOccurrenceEpoch('America/New_York', 2, 30, new Date('2026-03-08T00:00:00Z'))
    expect(wallTime(epoch, 'America/New_York')).toBe('2026-03-08 03:30')
  })
})

describe('formatAlarmTime', () => {
  const sevenInTokyo = Date.parse('2026-06-01T22:00:00Z') // Tue 07:00 in Tokyo

  it('shows the time in the zone the alarm was set in', () => {
    expect(formatAlarmTime(sevenInTokyo, 'Asia/Tokyo', false)).toMatch(/07:00|7:00/)
  })

  it('falls back to the device zone for alarms with no or unknown zone, instead of throwing', () => {
    expect(() => formatAlarmTime(sevenInTokyo, null)).not.toThrow()
    expect(() => formatAlarmTime(sevenInTokyo, 'Foo/Bar')).not.toThrow()
    expect(formatAlarmTime(NaN, 'Asia/Tokyo')).toBe('—')
  })
})
