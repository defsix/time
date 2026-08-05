import type { Translations } from './types'
import { en } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { de } from './locales/de'
import { pt } from './locales/pt'
import { ja } from './locales/ja'
import { zh } from './locales/zh'
import { pl } from './locales/pl'
import { ru } from './locales/ru'
import { cs } from './locales/cs'

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh' | 'pl' | 'ru' | 'cs'

const DICTIONARIES: Record<Locale, Translations> = { en, es, fr, de, pt, ja, zh, pl, ru, cs }

// Matched against the base language subtag only (e.g. "pt" from "pt-BR") —
// regional variants all fall back to the same translation, since none of
// these languages need region-specific wording. Date/time formatting is a
// separate concern (Intl.DateTimeFormat(undefined, ...) already follows the
// full device locale, region and all) and isn't affected by this list.
function detectLocale(): Locale {
  const candidates = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  for (const tag of candidates) {
    const base = tag.split('-')[0].toLowerCase()
    if (base in DICTIONARIES) return base as Locale
  }
  return 'en'
}

export const locale = detectLocale()
export const t: Translations = DICTIONARIES[locale]
