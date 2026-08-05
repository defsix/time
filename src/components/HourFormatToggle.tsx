import type { HourFormatChoice } from '../lib/useHourFormat'
import { t } from '../lib/i18n'

interface HourFormatToggleProps {
  choice: HourFormatChoice
  onChange: (choice: HourFormatChoice) => void
}

export default function HourFormatToggle({ choice, onChange }: HourFormatToggleProps) {
  const OPTIONS: { value: HourFormatChoice; label: string }[] = [
    { value: '12h', label: t.hourFormat.label12h },
    { value: '24h', label: t.hourFormat.label24h },
    { value: 'system', label: t.hourFormat.labelAuto },
  ]
  return (
    <div className="theme-toggle" role="group" aria-label={t.hourFormat.ariaLabel}>
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
