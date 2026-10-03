import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { formatAlarmTime, nextOccurrenceEpoch } from '../lib/alarmTime'
import { t } from '../lib/i18n'
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

// What <input type="time"> yields for a complete time; the field can also be
// cleared to "", which used to throw deep inside nextOccurrenceEpoch.
const TIME_VALUE = /^([01]\d|2[0-3]):([0-5]\d)$/

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
    const match = TIME_VALUE.exec(time)
    if (!match) return
    setStatus(null)
    try {
      if (!(await hasNotificationPermission())) {
        const granted = await requestNotificationPermission()
        if (!granted) {
          setStatus(t.cityAlarms.notifPermRequired)
          return
        }
      }

      const epoch = nextOccurrenceEpoch(targetTz, Number(match[1]), Number(match[2]))
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const result = await scheduleCityAlarm(id, targetLabel, epoch, targetLabel, targetTz)
      if (result === 'ok') {
        setStatus(t.cityAlarms.alarmSetFor(formatAlarmTime(epoch, targetTz)))
      } else if (result === 'ok_inexact') {
        setStatus(t.cityAlarms.alarmSetInexact)
      } else {
        setStatus(t.cityAlarms.notifPermRequired)
      }
    } catch (err) {
      // e.g. iOS refusing the notification request — say so rather than
      // leaving the panel looking like nothing happened.
      console.error('Setting the alarm failed', err)
      setStatus(t.cityAlarms.scheduleFailed)
    } finally {
      refresh()
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelCityAlarm(id)
    } finally {
      refresh()
    }
  }

  return (
    <div className="city-alarms">
      <button
        ref={buttonRef}
        className={`clock-card-icon-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {t.cityAlarms.alarm}
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
            <button className="city-alarms-set-btn" onClick={handleSetAlarm} disabled={!TIME_VALUE.test(time)}>
              {t.cityAlarms.setAlarmFor(targetLabel)}
            </button>
          </div>

          {status && <div className="city-alarms-status">{status}</div>}

          {needsNotificationPermission && (
            <div className="city-alarms-nudge">
              {t.cityAlarms.notifOffNudge}{' '}
              <button className="city-alarms-nudge-btn" onClick={() => requestNotificationPermission().then(refresh)}>
                {t.cityAlarms.enableNotifications}
              </button>
            </div>
          )}

          {!needsNotificationPermission && needsExactAlarmPermission && (
            <div className="city-alarms-nudge">
              {t.cityAlarms.exactAlarmNudge}{' '}
              <button className="city-alarms-nudge-btn" onClick={requestExactAlarmPermission}>
                {t.cityAlarms.grantExactAlarms}
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
                      {alarm.label} — {formatAlarmTime(alarm.epochMillis, alarm.timeZone)}
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
