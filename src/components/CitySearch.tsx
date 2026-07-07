import { useMemo, useState } from 'react'
import { ALL_CITIES } from '../lib/allCities'
import type { City } from '../lib/cities'

interface CitySearchProps {
  onSelectCity: (city: City) => void
}

export default function CitySearch({ onSelectCity }: CitySearchProps) {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const found: City[] = []
    for (const c of ALL_CITIES) {
      if (c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)) {
        found.push(c)
        if (found.length >= 8) break
      }
    }
    return found
  }, [query])

  return (
    <div className="city-search">
      <input
        type="text"
        placeholder="Search all cities…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search for a city"
      />
      {matches.length > 0 && (
        <ul className="city-search-results">
          {matches.map((c, i) => (
            <li key={`${c.name}-${c.country}-${i}`}>
              <button
                onClick={() => {
                  onSelectCity(c)
                  setQuery('')
                }}
              >
                {c.name}, {c.country}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
