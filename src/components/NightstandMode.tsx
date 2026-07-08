import { useWakeLock } from '../lib/useWakeLock'

interface NightstandModeProps {
  now: Date
  timeZone?: string
  label: string
  hour12: boolean
  onExit: () => void
}

export default function NightstandMode({ now, timeZone, label, hour12, onExit }: NightstandModeProps) {
  useWakeLock(true)

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12,
  }).format(now)
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)

  return (
    <div className="nightstand" onClick={onExit} role="button" tabIndex={0} aria-label="Exit nightstand mode">
      <div className="nightstand-time">{time}</div>
      <div className="nightstand-date">{date}</div>
      <div className="nightstand-label">{label}</div>
      <div className="nightstand-hint">Tap anywhere to exit</div>
    </div>
  )
}
