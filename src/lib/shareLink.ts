// Reflects the current selection in the URL (?lat=&lon=&name=&country=&tz=)
// via history.replaceState, so a link can be copied and shared without
// polluting browser back-button history on every click.

export interface ShareParams {
  lat: number
  lon: number
  name?: string
  country?: string
  tz?: string
}

export function readShareParamsFromURL(): ShareParams | null {
  const params = new URLSearchParams(window.location.search)
  const latStr = params.get('lat')
  const lonStr = params.get('lon')
  if (!latStr || !lonStr) return null
  const lat = parseFloat(latStr)
  const lon = parseFloat(lonStr)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return {
    lat,
    lon,
    name: params.get('name') ?? undefined,
    country: params.get('country') ?? undefined,
    tz: params.get('tz') ?? undefined,
  }
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
