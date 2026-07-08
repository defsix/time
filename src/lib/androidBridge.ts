// Thin wrapper around the native bridges the Android app (android/) injects
// into the WebView via WebView.addJavascriptInterface — AndroidAlarmBridge
// and AndroidDisplayBridge. Both are undefined on the plain website and in
// the iOS app, so every export here degrades to a no-op/false there; callers
// should feature-detect with isAndroidAlarmBridgeAvailable() /
// isAndroidDisplayBridgeAvailable() before showing Android-only UI.

export interface CityAlarm {
  id: string
  cityLabel: string
  epochMillis: number
  label: string
}

type ScheduleResult = 'ok' | 'ok_inexact' | 'needs_notification_permission'

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
}

declare global {
  interface Window {
    AndroidAlarmBridge?: AndroidAlarmBridgeNative
    AndroidDisplayBridge?: AndroidDisplayBridgeNative
    __onNotificationPermissionResult?: (granted: boolean) => void
  }
}

export function isAndroidAlarmBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && window.AndroidAlarmBridge != null
}

export function isAndroidDisplayBridgeAvailable(): boolean {
  return typeof window !== 'undefined' && window.AndroidDisplayBridge != null
}

export function hasNotificationPermission(): boolean {
  return window.AndroidAlarmBridge?.hasNotificationPermission() ?? false
}

export function hasExactAlarmPermission(): boolean {
  return window.AndroidAlarmBridge?.hasExactAlarmPermission() ?? false
}

/** Shows the system "allow notifications" prompt; resolves once the user answers. */
export function requestNotificationPermission(): Promise<boolean> {
  const bridge = window.AndroidAlarmBridge
  if (!bridge) return Promise.resolve(false)
  return new Promise((resolve) => {
    window.__onNotificationPermissionResult = (granted) => {
      window.__onNotificationPermissionResult = undefined
      resolve(granted)
    }
    bridge.requestNotificationPermission()
  })
}

/**
 * Opens the system "Alarms & reminders" special-access settings screen.
 * There's no in-app callback for this one (the user leaves and comes back);
 * re-check hasExactAlarmPermission() when the app regains focus.
 */
export function requestExactAlarmPermission(): void {
  window.AndroidAlarmBridge?.requestExactAlarmPermission()
}

export function scheduleCityAlarm(id: string, cityLabel: string, epochMillis: number, label: string): ScheduleResult {
  return window.AndroidAlarmBridge?.scheduleAlarm(id, cityLabel, epochMillis, label) ?? 'needs_notification_permission'
}

export function cancelCityAlarm(id: string): void {
  window.AndroidAlarmBridge?.cancelAlarm(id)
}

export function listCityAlarms(): CityAlarm[] {
  const raw = window.AndroidAlarmBridge?.listAlarms()
  if (!raw) return []
  try {
    return JSON.parse(raw) as CityAlarm[]
  } catch {
    return []
  }
}

export function setKeepScreenOn(on: boolean): void {
  window.AndroidDisplayBridge?.setKeepScreenOn(on)
}
