import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type EffectiveTheme = 'light' | 'dark'

const STORAGE_KEY = 'globe-time-theme'

function systemTheme(): EffectiveTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredChoice(): ThemeChoice {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

export function useTheme() {
  const [choice, setChoiceState] = useState<ThemeChoice>(readStoredChoice)
  const [effective, setEffective] = useState<EffectiveTheme>(() =>
    choice === 'system' ? systemTheme() : choice,
  )

  useEffect(() => {
    if (choice !== 'system') {
      setEffective(choice)
      return
    }
    setEffective(systemTheme())
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setEffective(systemTheme())
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [choice])

  useEffect(() => {
    document.documentElement.dataset.theme = effective
  }, [effective])

  const setChoice = useCallback((next: ThemeChoice) => {
    localStorage.setItem(STORAGE_KEY, next)
    setChoiceState(next)
  }, [])

  return { choice, effective, setChoice }
}
