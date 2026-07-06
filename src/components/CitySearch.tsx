import { useMemo, useState } from 'react'
import { CITIES, type City } from '../lib/cities'

interface CitySearchProps {
  onSelectCity: (city: City) => void
}

export default function CitySearch({ onSelectCity }: CitySearchProps) {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  return (
    <div className="city-search">
      <input
        type="text"
        placeholder="Jump to a city…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search for a city"
      />
      {matches.length > 0 && (
        <ul className="city-search-results">
          {matches.map((c) => (
            <li key={c.name}>
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
