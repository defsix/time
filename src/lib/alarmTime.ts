// Converts a wall-clock "HH:MM in some IANA time zone" into a real UTC
// instant, using only Intl.DateTimeFormat (no timezone database of our own,
// no dependency) — the same offset-correction trick date-fns-tz and friends
// use internally. Works for any IANA zone, DST included.
function zonedWallTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  // First guess: treat the wall-clock fields as if they were UTC.
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0)

  // Ask what wall-clock time that guess instant actually reads as in the
  // target zone, then correct by the difference (its UTC offset).
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(guess))
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>
  const asIfUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  )
  return guess + (guess - asIfUtc)
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
