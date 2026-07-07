import { cityMapping } from 'city-timezones'
import type { City } from './cities'
import { haversineDistanceKm } from './geo'

// Full searchable world-cities dataset (~7,300 entries, bundled at build time —
// no runtime fetch). The curated CITIES list in cities.ts stays small and is
// what's actually drawn as clickable dots on the globe; this is only used for
// search and for finding the city nearest to the user.
export const ALL_CITIES: City[] = cityMapping
  .filter((c) => c.timezone)
  .sort((a, b) => (b.pop || 0) - (a.pop || 0))
  .map((c) => ({
    name: c.province && c.province !== c.city ? `${c.city}, ${c.province}` : c.city,
    country: c.country,
    lat: c.lat,
    lon: c.lng,
    tz: c.timezone,
  }))

export function findNearestCity(lat: number, lon: number): City | null {
  let nearest: City | null = null
  let nearestDistance = Infinity
  for (const city of ALL_CITIES) {
    const distance = haversineDistanceKm(lat, lon, city.lat, city.lon)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = city
    }
  }
  return nearest
}
