import { useCallback, useState } from 'react'
import { readStorage, writeStorage } from './storage'

export type HourFormatChoice = '12h' | '24h' | 'system'

const STORAGE_KEY = 'globe-time-hour-format'

function systemPrefersHour12(): boolean {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 ?? false
}

function readStoredChoice(): HourFormatChoice {
  const stored = readStorage(STORAGE_KEY)
  return stored === '12h' || stored === '24h' || stored === 'system' ? stored : 'system'
}

export function useHourFormat() {
  const [choice, setChoiceState] = useState<HourFormatChoice>(readStoredChoice)

  const hour12 = choice === 'system' ? systemPrefersHour12() : choice === '12h'

  const setChoice = useCallback((next: HourFormatChoice) => {
    writeStorage(STORAGE_KEY, next)
    setChoiceState(next)
  }, [])

  return { choice, hour12, setChoice }
}
