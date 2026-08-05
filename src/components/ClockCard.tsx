import { formatOffset } from '../lib/geo'
import { t } from '../lib/i18n'

interface ClockCardProps {
  title: string
  subtitle: string
  now: Date
  timeZone?: string // IANA zone, when known (real city)
  solarOffsetHours?: number // fallback approximate offset when no IANA zone available
  accent?: 'user' | 'selection'
  hour12?: boolean
  headerExtra?: React.ReactNode
}

function partsFor(now: Date, hour12: boolean, timeZone?: string, solarOffsetHours?: number) {
  if (timeZone) {
    const time = new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12,
    }).format(now)
    const date = new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now)
    const offsetPart = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value
    return { time, date, offsetLabel: offsetPart ?? '' }
  }
  const shifted = new Date(now.getTime() + (solarOffsetHours ?? 0) * 3600_000)
  const time = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
  }).format(shifted)
  const date = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(shifted)
  return { time, date, offsetLabel: formatOffset(solarOffsetHours ?? 0) }
}

export default function ClockCard({
  title,
  subtitle,
  now,
  timeZone,
  solarOffsetHours,
  accent,
  hour12 = false,
  headerExtra,
}: ClockCardProps) {
  const { time, date, offsetLabel } = partsFor(now, hour12, timeZone, solarOffsetHours)
  return (
    <div className={`clock-card ${accent ?? ''}`}>
      <div className="clock-card-header">
        <span className="clock-card-title">{title}</span>
        <span className="clock-card-header-right">
          {headerExtra}
          <span className="clock-card-offset">{offsetLabel}</span>
        </span>
      </div>
      <div className="clock-card-time">{time}</div>
      <div className="clock-card-date">{date}</div>
      <div className="clock-card-subtitle">{subtitle}</div>
      {!timeZone && <div className="clock-card-note">{t.clockCard.approxSolarNote}</div>}
    </div>
  )
}
