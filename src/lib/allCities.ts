import type { City } from './cities'
import { haversineDistanceKm } from './geo'

// Full searchable world-cities dataset (~7,300 entries). This is ~2MB raw, so
// it's kept out of the main bundle and only fetched (as its own chunk) the
// first time something actually needs it — city search or a nearest-city
// lookup — rather than on every page load.
let cached: City[] | null = null
let loading: Promise<City[]> | null = null

export function loadAllCities(): Promise<City[]> {
  if (cached) return Promise.resolve(cached)
  if (!loading) {
    loading = import('city-timezones').then(({ cityMapping }) => {
      const cities = cityMapping
        .filter((c) => c.timezone)
        .sort((a, b) => (b.pop || 0) - (a.pop || 0))
        .map((c) => ({
          name: c.province && c.province !== c.city ? `${c.city}, ${c.province}` : c.city,
          country: c.country,
          lat: c.lat,
          lon: c.lng,
          tz: c.timezone,
        }))
      cached = cities
      return cities
    })
  }
  return loading
}

export async function findNearestCity(lat: number, lon: number): Promise<City | null> {
  const cities = await loadAllCities()
  let nearest: City | null = null
  let nearestDistance = Infinity
  for (const city of cities) {
    const distance = haversineDistanceKm(lat, lon, city.lat, city.lon)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = city
    }
  }
  return nearest
}
