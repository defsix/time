/**
 * Whether `tz` is an IANA zone this browser's Intl knows. Any untrusted zone
 * (a share link, stored data) must pass this before reaching
 * Intl.DateTimeFormat during render — an unknown zone makes it throw a
 * RangeError, which takes the whole page down.
 */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}
