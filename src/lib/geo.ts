import * as THREE from 'three'

export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return new THREE.Vector3(x, y, z)
}

export function vector3ToLatLon(v: THREE.Vector3, radius: number): { lat: number; lon: number } {
  const normalized = v.clone().normalize().multiplyScalar(radius)
  const phi = Math.acos(THREE.MathUtils.clamp(normalized.y / radius, -1, 1))
  let theta = Math.atan2(normalized.z, -normalized.x)
  const lat = 90 - phi * (180 / Math.PI)
  let lon = theta * (180 / Math.PI) - 180
  if (lon < -180) lon += 360
  if (lon > 180) lon -= 360
  return { lat, lon }
}

// Rough solar-time UTC offset for an arbitrary point on the globe (15 degrees
// of longitude per hour). This is a geometric approximation, not a real
// political time zone — used when the user clicks empty ocean/land away from
// any city marker.
export function approxSolarOffsetHours(lon: number): number {
  return Math.round(lon / 15)
}

export function formatOffset(hours: number): string {
  const sign = hours >= 0 ? '+' : '-'
  const abs = Math.abs(hours)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Great-circle interpolation between two unit vectors, used to animate the
// camera along the sphere's surface (a straight lerp would cut through the globe).
export function slerpUnitVectors(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1)
  const theta = Math.acos(dot) * t
  if (theta === 0) return a.clone()
  const relative = b.clone().sub(a.clone().multiplyScalar(dot)).normalize()
  return a.clone().multiplyScalar(Math.cos(theta)).add(relative.multiplyScalar(Math.sin(theta)))
}
