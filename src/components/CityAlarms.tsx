import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { nextOccurrenceEpoch } from '../lib/alarmTime'
import {
  type CityAlarm,
  cancelCityAlarm,
  hasExactAlarmPermission,
  hasNotificationPermission,
  listCityAlarms,
  requestExactAlarmPermission,
  requestNotificationPermission,
  scheduleCityAlarm,
} from '../lib/nativeBridge'

interface CityAlarmsProps {
  /** IANA time zone the alarm's picked HH:MM is interpreted in. */
  targetTz: string
  /** Shown on the button/panel and stored with the alarm, e.g. "Tokyo, Japan" or "Your Location". */
  targetLabel: string
}

const PANEL_WIDTH = 280
const VIEWPORT_MARGIN = 8

function formatAlarmTime(epochMillis: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(epochMillis))
}

export default function CityAlarms({ targetTz, targetLabel }: CityAlarmsProps) {
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('07:00')
  const [alarms, setAlarms] = useState<CityAlarm[]>([])
  const [needsNotificationPermission, setNeedsNotificationPermission] = useState(false)
  const [needsExactAlarmPermission, setNeedsExactAlarmPermission] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)

  async function refresh() {
    const [alarmsList, hasNotif, hasExact] = await Promise.all([
      listCityAlarms(),
      hasNotificationPermission(),
      hasExactAlarmPermission(),
    ])
    setAlarms(alarmsList)
    setNeedsNotificationPermission(!hasNotif)
    setNeedsExactAlarmPermission(!hasExact)
  }

  // The panel is positioned in fixed (viewport) coordinates, clamped to stay
  // fully on-screen, rather than CSS-anchored to the toggle button itself —
  // that button sits mid-row (Pin/Alarm/Copy link), not at the card's right
  // edge, so a plain `right: 0` anchor let a 280px-wide panel run off the
  // left edge of the viewport on narrow phones.
  function positionPanel() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)
    const left = Math.min(
      Math.max(rect.right - width, VIEWPORT_MARGIN),
      window.innerWidth - width - VIEWPORT_MARGIN,
    )
    setPanelStyle({ top: rect.bottom + 8, left, width })
  }

  useEffect(() => {
    if (!open) return
    refresh()
    positionPanel()
    // The user may have just come back from the system Settings screen
    // after granting the exact-alarm special access — re-check on focus.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('resize', positionPanel)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('resize', positionPanel)
    }
  }, [open])

  async function handleSetAlarm() {
    setStatus(null)
    if (!(await hasNotificationPermission())) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        setStatus('Notifications permission is required to ring an alarm.')
        refresh()
        return
      }
    }

    const [hourStr, minuteStr] = time.split(':')
    const hour = Number(hourStr)
    const minute = Number(minuteStr)
    const epoch = nextOccurrenceEpoch(targetTz, hour, minute)
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const result = await scheduleCityAlarm(id, targetLabel, epoch, targetLabel)
    if (result === 'ok') {
      setStatus(`Alarm set for ${formatAlarmTime(epoch, targetTz)}.`)
    } else if (result === 'ok_inexact') {
      setStatus(`Alarm set (may ring up to ~10 min late — grant exact alarm access below for precise timing).`)
    } else {
      setStatus('Notifications permission is required to ring an alarm.')
    }
    refresh()
  }

  async function handleCancel(id: string) {
    await cancelCityAlarm(id)
    refresh()
  }

  return (
    <div className="city-alarms">
      <button
        ref={buttonRef}
        className={`clock-card-icon-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        Alarm
      </button>

      {open && (
        <div className="city-alarms-panel" style={panelStyle}>
          <div className="city-alarms-row">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="city-alarms-time-input"
            />
            <button className="city-alarms-set-btn" onClick={handleSetAlarm}>
              Set alarm for {targetLabel}
            </button>
          </div>

          {status && <div className="city-alarms-status">{status}</div>}

          {needsNotificationPermission && (
            <div className="city-alarms-nudge">
              Notifications are off, so alarms can't ring.{' '}
              <button className="city-alarms-nudge-btn" onClick={() => requestNotificationPermission().then(refresh)}>
                Enable notifications
              </button>
            </div>
          )}

          {!needsNotificationPermission && needsExactAlarmPermission && (
            <div className="city-alarms-nudge">
              Exact alarm access isn't granted — alarms may ring up to ~10 min late.{' '}
              <button className="city-alarms-nudge-btn" onClick={requestExactAlarmPermission}>
                Grant exact alarms
              </button>
            </div>
          )}

          {alarms.length > 0 && (
            <ul className="city-alarms-list">
              {alarms
                .slice()
                .sort((a, b) => a.epochMillis - b.epochMillis)
                .map((alarm) => (
                  <li key={alarm.id} className="city-alarms-list-item">
                    <span>
                      {alarm.label} — {new Intl.DateTimeFormat('en-US', {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(new Date(alarm.epochMillis))}
                    </span>
                    <button className="city-alarms-cancel-btn" onClick={() => handleCancel(alarm.id)}>
                      ✕
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
