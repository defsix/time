import type { ThemeChoice } from '../lib/useTheme'

interface ThemeToggleProps {
  choice: ThemeChoice
  onChange: (choice: ThemeChoice) => void
}

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
]

export default function ThemeToggle({ choice, onChange }: ThemeToggleProps) {
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
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
