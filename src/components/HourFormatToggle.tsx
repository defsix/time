import type { HourFormatChoice } from '../lib/useHourFormat'

interface HourFormatToggleProps {
  choice: HourFormatChoice
  onChange: (choice: HourFormatChoice) => void
}

const OPTIONS: { value: HourFormatChoice; label: string }[] = [
  { value: '12h', label: '12h' },
  { value: '24h', label: '24h' },
  { value: 'system', label: 'Auto' },
]

export default function HourFormatToggle({ choice, onChange }: HourFormatToggleProps) {
  return (
    <div className="theme-toggle" role="group" aria-label="Time format">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={choice === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
          aria-pressed={choice === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
