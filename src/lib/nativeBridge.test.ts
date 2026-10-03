import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestNotificationPermission } from './nativeBridge'

describe('requestNotificationPermission (Android bridge)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares one in-flight prompt instead of orphaning the first caller', async () => {
    const native = { requestNotificationPermission: vi.fn() }
    const win: Record<string, unknown> = { AndroidAlarmBridge: native }
    vi.stubGlobal('window', win)

    const first = requestNotificationPermission()
    const second = requestNotificationPermission()
    expect(native.requestNotificationPermission).toHaveBeenCalledTimes(1)

    // What AlarmBridge.kt does once the user answers the system prompt.
    ;(win.__onNotificationPermissionResult as (granted: boolean) => void)(true)
    await expect(first).resolves.toBe(true)
    await expect(second).resolves.toBe(true)

    // A later request opens a fresh prompt.
    void requestNotificationPermission()
    expect(native.requestNotificationPermission).toHaveBeenCalledTimes(2)
  })
})
