import type { City } from '../lib/cities'

interface PinnedCitiesStripProps {
  cities: City[]
  now: Date
  hour12: boolean
  onSelect: (city: City) => void
  onRemove: (city: City) => void
}

function timeFor(now: Date, tz: string, hour12: boolean): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12 }).format(now)
}

export default function PinnedCitiesStrip({ cities, now, hour12, onSelect, onRemove }: PinnedCitiesStripProps) {
  if (cities.length === 0) return null
  return (
    <div className="pinned-strip">
      {cities.map((city) => (
        <button key={`${city.name}-${city.country}`} className="pinned-tile" onClick={() => onSelect(city)}>
          <span
            className="pinned-tile-remove"
            role="button"
            tabIndex={0}
            aria-label={`Unpin ${city.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(city)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onRemove(city)
              }
            }}
          >
            ×
          </span>
          <span className="pinned-tile-time">{timeFor(now, city.tz, hour12)}</span>
          <span className="pinned-tile-name">{city.name}</span>
        </button>
      ))}
    </div>
  )
}
