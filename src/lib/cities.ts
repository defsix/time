export interface City {
  name: string
  country: string
  lat: number
  lon: number
  tz: string
}

// A representative spread of cities across every UTC offset band and continent,
// used as clickable markers on the globe and for the search/quick-pick list.
export const CITIES: City[] = [
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { name: 'New Delhi', country: 'India', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka' },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Perth', country: 'Australia', lat: -31.9505, lon: 115.8605, tz: 'Australia/Perth' },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' },
  { name: 'Honolulu', country: 'USA', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
  { name: 'Anchorage', country: 'USA', lat: 61.2181, lon: -149.9003, tz: 'America/Anchorage' },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Denver', country: 'USA', lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
  { name: 'Chicago', country: 'USA', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { name: 'Bogotá', country: 'Colombia', lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428, tz: 'America/Lima' },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693, tz: 'America/Santiago' },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5558, lon: -46.6396, tz: 'America/Sao_Paulo' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792, tz: 'Africa/Lagos' },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi' },
]
