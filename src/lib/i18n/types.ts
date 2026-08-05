// Shape shared by every locale dictionary. Plain strings for static text;
// functions for anything with dynamic values, since word order/phrasing
// around a number or name varies too much between languages for a generic
// string-interpolation template to handle well.
export interface Translations {
  app: {
    title: string
    subtitle: string
    nightstand: string
    yourLocation: string
    selectedPoint: string
    globeHint: string
    geoDenied: string
    geoUnsupported: string
    footer: string
  }
  globe: {
    sun: string
    moon: string
  }
  clockCard: {
    pin: string
    pinned: string
    approxSolarNote: string
  }
  copyLink: {
    copyLink: string
    copied: string
  }
  hourFormat: {
    label12h: string
    label24h: string
    labelAuto: string
    ariaLabel: string
  }
  theme: {
    labelLight: string
    labelDark: string
    labelAuto: string
    ariaLabel: string
  }
  citySearch: {
    placeholder: string
    ariaLabel: string
    loading: string
  }
  cityAlarms: {
    alarm: string
    setAlarmFor: (label: string) => string
    notifPermRequired: string
    alarmSetFor: (time: string) => string
    alarmSetInexact: string
    notifOffNudge: string
    enableNotifications: string
    exactAlarmNudge: string
    grantExactAlarms: string
  }
  nightstand: {
    exitAria: string
    tapToExit: string
  }
  pinnedCities: {
    unpinAria: (name: string) => string
  }
  moonPhases: {
    newMoon: string
    waxingCrescent: string
    firstQuarter: string
    waxingGibbous: string
    fullMoon: string
    waningGibbous: string
    lastQuarter: string
    waningCrescent: string
  }
  solarLunar: {
    title: string
    locationIndependent: string
    selectCityNote: string
    polarDay: string
    polarNight: string
    sunrise: string
    sunset: string
    solarNoon: string
    dayLength: string
    illuminated: (percent: number) => string
  }
  timeSourcesPanel: {
    title: string
    resync: string
    measuring: string
    deviceClockStatus: (ms: number, direction: 'ahead' | 'behind') => string
    lastChecked: (time: string) => string
    failed: string
    checking: string
    endpoint: string
    method: string
    protocol: string
    http: string
    contentType: string
    size: string
    dns: string
    connect: string
    ttfb: string
    download: string
    rawResponse: string
    error: string
    rttOffset: (latencyMs: number, offsetMs: number) => string
    footnote: string
  }
  timeSources: {
    device: { name: string; protocol: string; description: string }
    timeapi_io: { name: string; protocol: string; description: string }
    'binance-time': { name: string; protocol: string; description: string }
    'time-now': { name: string; protocol: string; description: string }
  }
}
