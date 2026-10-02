// localStorage throws (a SecurityError) instead of returning null when the
// browser blocks site storage, e.g. Chrome's "Block all cookies" setting —
// and the settings hooks read it during render, so an unguarded access takes
// the whole page down. With storage blocked, preferences just don't persist.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage blocked or full — the preference just won't persist.
  }
}
