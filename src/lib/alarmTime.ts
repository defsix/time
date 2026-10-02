// Converts a wall-clock "HH:MM in some IANA time zone" into a real UTC
// instant, using only Intl.DateTimeFormat (no timezone database of our own,
// no dependency). Works for any IANA zone, DST included.

/** The zone's UTC offset (ms, local minus UTC) in effect at `instant`. */
function offsetAt(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>
  const asIfUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  )
  return asIfUtc - (instant - (((instant % 1000) + 1000) % 1000))
}

function zonedWallTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0)

  // The offset can only be one of the values in effect just before or just
  // after any DST change near this date. A single correction using the
  // offset at the wrong side of the change lands an hour off, so try both
  // and keep the ones that actually read back as the requested wall time.
  const before = offsetAt(wall - 24 * 3600_000, timeZone)
  const after = offsetAt(wall + 24 * 3600_000, timeZone)
  const matches = [before, after]
    .map((offset) => wall - offset)
    .filter((instant) => wall - offsetAt(instant, timeZone) === instant)

  // Repeated hour (clocks go back): ring at the first occurrence.
  if (matches.length > 0) return Math.min(...matches)
  // Skipped hour (clocks go forward): shift later by the gap, e.g. 02:30
  // becomes 03:30 — the same choice Temporal's default disambiguation makes.
  return wall - before
}

/**
 * The next future UTC epoch (ms) at which it will be `hour:minute` local
 * time in `timeZone` — today if that time hasn't happened yet there, else
 * tomorrow.
 */
export function nextOccurrenceEpoch(timeZone: string, hour: number, minute: number, from = new Date()): number {
  const todayParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(from)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {})

  const year = Number(todayParts.year)
  const month = Number(todayParts.month)
  const day = Number(todayParts.day)

  const candidate = zonedWallTimeToUtc(year, month, day, hour, minute, timeZone)
  if (candidate > from.getTime()) return candidate

  // That time already passed today in the target zone — try tomorrow.
  // Advance the calendar date by finding "now + ~24h" and reformatting,
  // rather than assuming day+1 is valid (handles month/year rollover).
  const tomorrow = new Date(zonedWallTimeToUtc(year, month, day, hour, minute, timeZone) + 24 * 3600_000)
  const tomorrowParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(tomorrow)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {})

  return zonedWallTimeToUtc(
    Number(tomorrowParts.year),
    Number(tomorrowParts.month),
    Number(tomorrowParts.day),
    hour,
    minute,
    timeZone,
  )
}
