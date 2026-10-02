// Reflects the current selection in the URL (?lat=&lon=&name=&country=&tz=)
// via history.replaceState, so a link can be copied and shared without
// polluting browser back-button history on every click.

import { isValidTimeZone } from './timeZone'

export interface ShareParams {
  lat: number
  lon: number
  name?: string
  country?: string
  tz?: string
}

const MAX_LABEL_LENGTH = 100

function label(value: string | null): string | undefined {
  return value?.trim().slice(0, MAX_LABEL_LENGTH) || undefined
}

/**
 * Share links are untrusted input: anyone can craft one. Out-of-range
 * coordinates are rejected, and an unknown time zone is dropped (degrading
 * the link to a plain point selection) rather than reaching
 * Intl.DateTimeFormat, where it would throw mid-render and blank the page.
 */
export function parseShareParams(search: string): ShareParams | null {
  const params = new URLSearchParams(search)
  const latStr = params.get('lat')
  const lonStr = params.get('lon')
  if (!latStr || !lonStr) return null
  const lat = parseFloat(latStr)
  const lon = parseFloat(lonStr)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  const tz = params.get('tz')
  return {
    lat,
    lon,
    name: label(params.get('name')),
    country: label(params.get('country')),
    tz: tz && isValidTimeZone(tz) ? tz : undefined,
  }
}

export function readShareParamsFromURL(): ShareParams | null {
  return parseShareParams(window.location.search)
}

export function writeShareParamsToURL(params: ShareParams | null) {
  const url = new URL(window.location.href)
  url.search = ''
  if (params) {
    url.searchParams.set('lat', params.lat.toFixed(4))
    url.searchParams.set('lon', params.lon.toFixed(4))
    if (params.name) url.searchParams.set('name', params.name)
    if (params.country) url.searchParams.set('country', params.country)
    if (params.tz) url.searchParams.set('tz', params.tz)
  }
  window.history.replaceState(null, '', url.toString())
}
