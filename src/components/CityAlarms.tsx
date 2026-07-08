import { useEffect, useState } from 'react'
import type { City } from '../lib/cities'
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
} from '../lib/androidBridge'

interface CityAlarmsProps {
  city: City
}

function formatAlarmTime(epochMillis: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(epochMillis))
}

export default function CityAlarms({ city }: CityAlarmsProps) {
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('07:00')
  const [alarms, setAlarms] = useState<CityAlarm[]>([])
  const [needsNotificationPermission, setNeedsNotificationPermission] = useState(false)
  const [needsExactAlarmPermission, setNeedsExactAlarmPermission] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  function refresh() {
    setAlarms(listCityAlarms())
    setNeedsNotificationPermission(!hasNotificationPermission())
    setNeedsExactAlarmPermission(!hasExactAlarmPermission())
  }

  useEffect(() => {
    if (!open) return
    refresh()
    // The user may have just come back from the system Settings screen
    // after granting the exact-alarm special access — re-check on focus.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [open])

  async function handleSetAlarm() {
    setStatus(null)
    if (!hasNotificationPermission()) {
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
    const epoch = nextOccurrenceEpoch(city.tz, hour, minute)
    const label = `${city.name}, ${city.country}`
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const result = scheduleCityAlarm(id, label, epoch, label)
    if (result === 'ok') {
      setStatus(`Alarm set for ${formatAlarmTime(epoch, city.tz)} in ${city.name}.`)
    } else if (result === 'ok_inexact') {
      setStatus(`Alarm set (may ring up to ~10 min late — grant exact alarm access below for precise timing).`)
    } else {
      setStatus('Notifications permission is required to ring an alarm.')
    }
    refresh()
  }

  function handleCancel(id: string) {
    cancelCityAlarm(id)
    refresh()
  }

  return (
    <div className="city-alarms">
      <button className={`clock-card-icon-btn ${open ? 'active' : ''}`} onClick={() => setOpen((v) => !v)}>
        Alarm
      </button>

      {open && (
        <div className="city-alarms-panel">
          <div className="city-alarms-row">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="city-alarms-time-input"
            />
            <button className="city-alarms-set-btn" onClick={handleSetAlarm}>
              Set alarm for {city.name}
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
