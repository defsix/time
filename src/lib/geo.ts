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
