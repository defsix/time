// Unified wrapper around the two mobile apps' native bridges: Android's
// synchronous window.AndroidAlarmBridge/AndroidDisplayBridge (WebView's
// addJavascriptInterface, which can return values directly) and iOS's
// async-only window.__worldTimeIOSBridge (a WKScriptMessageHandler
// round-trip — see native-bridge-shim.js — since WKWebView has no
// synchronous JS<->native call mechanism). Every export here is
// Promise-based so callers don't need to care which platform they're on;
// on the plain website (neither bridge present) everything degrades to a
// no-op/false/empty result.

export interface CityAlarm {
  id: string
  cityLabel: string
  epochMillis: number
  label: string
}

export type ScheduleResult = 'ok' | 'ok_inexact' | 'needs_notification_permission'

interface AndroidAlarmBridgeNative {
  hasNotificationPermission(): boolean
  requestNotificationPermission(): void
  hasExactAlarmPermission(): boolean
  requestExactAlarmPermission(): void
  scheduleAlarm(id: string, cityLabel: string, epochMillis: number, label: string): ScheduleResult
  cancelAlarm(id: string): void
  listAlarms(): string
}

interface AndroidDisplayBridgeNative {
  setKeepScreenOn(on: boolean): void
  setStatusBarAppearance(isLightBackground: boolean): void
}

type IOSBridgeInvoke = (method: string, args?: unknown[]) => Promise<unknown>

declare global {
  interface Window {
    AndroidAlarmBridge?: AndroidAlarmBridgeNative
    AndroidDisplayBridge?: AndroidDisplayBridgeNative
    __worldTimeIOSBridge?: IOSBridgeInvoke
    __onNotificationPermissionResult?: (granted: boolean) => void
  }
}

function ios(): IOSBridgeInvoke | undefined {
  return window.__worldTimeIOSBridge
}

export function isAlarmBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && (window.AndroidAlarmBridge != null || window.__worldTimeIOSBridge != null)
}

export function isDisplayBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && (window.AndroidDisplayBridge != null || window.__worldTimeIOSBridge != null)
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (window.AndroidAlarmBridge) return window.AndroidAlarmBridge.hasNotificationPermission()
  if (ios()) return (await ios()!('hasNotificationPermission')) as boolean
  return false
}

/**
 * Android-specific concept (the "Alarms & reminders" special access needed
 * for precise `AlarmManager.setExactAndAllowWhileIdle`-style firing) — iOS
 * local notifications always fire at the requested instant, so this
 * resolves `true` there.
 */
export async function hasExactAlarmPermission(): Promise<boolean> {
  if (window.AndroidAlarmBridge) return window.AndroidAlarmBridge.hasExactAlarmPermission()
  if (ios()) return (await ios()!('hasExactAlarmPermission')) as boolean
  return false
}

/** Shows the system "allow notifications" prompt; resolves once the user answers. */
export async function requestNotificationPermission(): Promise<boolean> {
  const android = window.AndroidAlarmBridge
  if (android) {
    return new Promise((resolve) => {
      window.__onNotificationPermissionResult = (granted) => {
        window.__onNotificationPermissionResult = undefined
        resolve(granted)
      }
      android.requestNotificationPermission()
    })
  }
  if (ios()) return (await ios()!('requestNotificationPermission')) as boolean
  return false
}

/**
 * Opens the system "Alarms & reminders" special-access settings screen
 * (Android only). There's no in-app callback for this one (the user leaves
 * and comes back); re-check hasExactAlarmPermission() when the app regains
 * focus. No-op on iOS, which has no equivalent settings screen.
 */
export function requestExactAlarmPermission(): void {
  if (window.AndroidAlarmBridge) {
    window.AndroidAlarmBridge.requestExactAlarmPermission()
    return
  }
  void ios()?.('requestExactAlarmPermission')
}

export async function scheduleCityAlarm(
  id: string,
  cityLabel: string,
  epochMillis: number,
  label: string,
): Promise<ScheduleResult> {
  if (window.AndroidAlarmBridge) return window.AndroidAlarmBridge.scheduleAlarm(id, cityLabel, epochMillis, label)
  if (ios()) return (await ios()!('scheduleAlarm', [id, cityLabel, epochMillis, label])) as ScheduleResult
  return 'needs_notification_permission'
}

export async function cancelCityAlarm(id: string): Promise<void> {
  if (window.AndroidAlarmBridge) {
    window.AndroidAlarmBridge.cancelAlarm(id)
    return
  }
  if (ios()) await ios()!('cancelAlarm', [id])
}

export async function listCityAlarms(): Promise<CityAlarm[]> {
  if (window.AndroidAlarmBridge) {
    const raw = window.AndroidAlarmBridge.listAlarms()
    try {
      return JSON.parse(raw) as CityAlarm[]
    } catch {
      return []
    }
  }
  if (ios()) return ((await ios()!('listAlarms')) as CityAlarm[] | null) ?? []
  return []
}

export function setKeepScreenOn(on: boolean): void {
  if (window.AndroidDisplayBridge) {
    window.AndroidDisplayBridge.setKeepScreenOn(on)
    return
  }
  void ios()?.('setKeepScreenOn', [on])
}

/** Keeps the native status bar icons legible against the page's actual current background. */
export function setStatusBarAppearance(isLightBackground: boolean): void {
  if (window.AndroidDisplayBridge) {
    window.AndroidDisplayBridge.setStatusBarAppearance(isLightBackground)
    return
  }
  void ios()?.('setStatusBarAppearance', [isLightBackground])
}
