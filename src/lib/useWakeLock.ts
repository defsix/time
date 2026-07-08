import { useEffect, useRef } from 'react'
import { setKeepScreenOn } from './androidBridge'

/**
 * Keeps the screen on while `active` is true, via the standard Web Wake
 * Lock API (works on the plain website too) with a native
 * FLAG_KEEP_SCREEN_ON fallback for the Android app, in case the WebView's
 * Wake Lock support is unavailable or the OS declines the request.
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return

    setKeepScreenOn(true)
    let cancelled = false

    async function acquire() {
      if (!('wakeLock' in navigator)) return
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
        } else {
          sentinelRef.current = sentinel
        }
      } catch {
        // Ignore — the native fallback (Android) or nothing (other
        // browsers, or the OS declined e.g. due to low battery) still applies.
      }
    }
    acquire()

    // Wake locks are released automatically when the document is hidden
    // (e.g. screen actually turned off); re-acquire on return.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) acquire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
      setKeepScreenOn(false)
    }
  }, [active])
}
