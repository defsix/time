import type { ThemeChoice } from '../lib/useTheme'
import { t } from '../lib/i18n'

interface ThemeToggleProps {
  choice: ThemeChoice
  onChange: (choice: ThemeChoice) => void
}

export default function ThemeToggle({ choice, onChange }: ThemeToggleProps) {
  const OPTIONS: { value: ThemeChoice; label: string }[] = [
    { value: 'light', label: t.theme.labelLight },
    { value: 'dark', label: t.theme.labelDark },
    { value: 'system', label: t.theme.labelAuto },
  ]
  return (
    <div className="theme-toggle" role="group" aria-label={t.theme.ariaLabel}>
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
