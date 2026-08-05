import type { Translations } from '../types'

export const en: Translations = {
  app: {
    title: 'World Time',
    subtitle: 'A Live World Clock, click any city to see its time.',
    nightstand: 'Nightstand',
    yourLocation: 'Your Location',
    selectedPoint: 'Selected Point',
    globeHint:
      'Drag to rotate · scroll to zoom · tap near a marker for a city, or tap anywhere else on the globe for an approximate local time',
    geoDenied: ' (location permission denied — using browser time zone only)',
    geoUnsupported: ' (geolocation unsupported — using browser time zone)',
    footer:
      "Built with Three.js. Time cross-checked against TimeAPI.io, Binance's clock-sync endpoint, and a WorldTimeAPI-compatible HTTP time service (time.now) — see the Time Sources panel for live tech details on each. Sunrise, sunset, and moon phase are computed locally from standard solar/lunar position formulas.",
  },
  globe: {
    sun: 'Sun',
    moon: 'Moon',
  },
  clockCard: {
    pin: 'Pin',
    pinned: 'Pinned',
    approxSolarNote: 'Approximate solar time (15°/hr) — no official time zone data for this exact point.',
  },
  copyLink: {
    copyLink: 'Copy link',
    copied: 'Copied!',
  },
  hourFormat: {
    label12h: '12h',
    label24h: '24h',
    labelAuto: 'Auto',
    ariaLabel: 'Time format',
  },
  theme: {
    labelLight: 'Light',
    labelDark: 'Dark',
    labelAuto: 'Auto',
    ariaLabel: 'Color theme',
  },
  citySearch: {
    placeholder: 'Search all cities…',
    ariaLabel: 'Search for a city',
    loading: 'Loading city index…',
  },
  cityAlarms: {
    alarm: 'Alarm',
    setAlarmFor: (label) => `Set alarm for ${label}`,
    notifPermRequired: 'Notifications permission is required to ring an alarm.',
    alarmSetFor: (time) => `Alarm set for ${time}.`,
    alarmSetInexact: 'Alarm set (may ring up to ~10 min late — grant exact alarm access below for precise timing).',
    notifOffNudge: "Notifications are off, so alarms can't ring.",
    enableNotifications: 'Enable notifications',
    exactAlarmNudge: "Exact alarm access isn't granted — alarms may ring up to ~10 min late.",
    grantExactAlarms: 'Grant exact alarms',
  },
  nightstand: {
    exitAria: 'Exit nightstand mode',
    tapToExit: 'Tap anywhere to exit',
  },
  pinnedCities: {
    unpinAria: (name) => `Unpin ${name}`,
  },
  moonPhases: {
    newMoon: 'New Moon',
    waxingCrescent: 'Waxing Crescent',
    firstQuarter: 'First Quarter',
    waxingGibbous: 'Waxing Gibbous',
    fullMoon: 'Full Moon',
    waningGibbous: 'Waning Gibbous',
    lastQuarter: 'Last Quarter',
    waningCrescent: 'Waning Crescent',
  },
  solarLunar: {
    title: 'Sun & Moon',
    locationIndependent: 'Moon phase is location-independent',
    selectCityNote: 'Select a city, or allow location access, to see sunrise & sunset times here.',
    polarDay: 'The sun does not set today at this location (polar day).',
    polarNight: 'The sun does not rise today at this location (polar night).',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    solarNoon: 'Solar noon',
    dayLength: 'Day length',
    illuminated: (percent) => `${percent}% illuminated`,
  },
  timeSourcesPanel: {
    title: 'Time Sources',
    resync: 'Resync',
    measuring: 'Measuring network sources…',
    deviceClockStatus: (ms, direction) =>
      `Device clock is ${ms} ms ${direction === 'ahead' ? 'ahead of' : 'behind'} the multi-source consensus.`,
    lastChecked: (time) => ` Last checked ${time}.`,
    failed: 'failed',
    checking: 'checking…',
    endpoint: 'Endpoint:',
    method: 'Method:',
    protocol: 'Protocol:',
    http: 'HTTP:',
    contentType: 'Content-Type:',
    size: 'Size:',
    dns: 'DNS:',
    connect: 'Connect:',
    ttfb: 'TTFB:',
    download: 'Download:',
    rawResponse: 'Raw response:',
    error: 'Error:',
    rttOffset: (latencyMs, offsetMs) => `${latencyMs}ms rtt · offset ${offsetMs}ms`,
    footnote:
      "Each source is fetched independently and timed with the browser's Performance API, retrying once on a dropped or slow connection before it's marked failed — mobile networks routinely stall one attempt in a row. The offset for each network source estimates one-way latency as half the round trip (NTP-style) and compares the result to your device clock. The consensus value used to correct the displayed time is the median offset across all successfully-reached sources, so a single slow or wrong API can't skew the result.",
  },
  timeSources: {
    device: {
      name: 'Device System Clock',
      protocol: 'OS clock, usually NTP-disciplined by your device/router',
      description:
        "Your computer or phone's own clock. Modern OSes sync this via NTP/NTS in the background, so it is normally accurate to within milliseconds, but it can drift if the device has been offline a long time.",
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: 'A dedicated third-party time REST API, kept as the anchor time-specific source in the lineup.',
    },
    'binance-time': {
      name: 'Binance server time',
      protocol: 'HTTPS REST, financial exchange infrastructure',
      description:
        "Not a time API at all — a global crypto exchange's clock-sync endpoint, published specifically so trading clients can detect drift before their signed API requests get rejected. Millisecond precision and run on infrastructure with a strong uptime incentive, since a lot of live trading depends on it.",
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST, independent infrastructure from the sources above',
      description:
        'A free, no-key, CORS-enabled HTTP time/timezone API in the same WorldTimeAPI-compatible family as the original (now-sunset) WorldTimeAPI — an independent fourth data point.',
    },
  },
}
