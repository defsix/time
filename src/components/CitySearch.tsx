import { useEffect, useMemo, useState } from 'react'
import { loadAllCities } from '../lib/allCities'
import type { City } from '../lib/cities'

interface CitySearchProps {
  onSelectCity: (city: City) => void
}

export default function CitySearch({ onSelectCity }: CitySearchProps) {
  const [query, setQuery] = useState('')
  const [allCities, setAllCities] = useState<City[] | null>(null)

  useEffect(() => {
    // Kick off the (code-split) full city dataset fetch as soon as the search
    // box mounts, well before the user necessarily types anything.
    loadAllCities().then(setAllCities)
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2 || !allCities) return []
    const found: City[] = []
    for (const c of allCities) {
      if (c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)) {
        found.push(c)
        if (found.length >= 8) break
      }
    }
    return found
  }, [query, allCities])

  const showLoadingHint = query.trim().length >= 2 && !allCities

  return (
    <div className="city-search">
      <input
        type="text"
        placeholder="Search all cities…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search for a city"
      />
      {showLoadingHint && (
        <ul className="city-search-results">
          <li className="city-search-loading">Loading city index…</li>
        </ul>
      )}
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
