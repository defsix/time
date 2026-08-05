import type { Translations } from '../types'

export const de: Translations = {
  app: {
    title: 'Weltzeit',
    subtitle: 'Eine Weltuhr in Echtzeit – klicke auf eine Stadt, um ihre Uhrzeit zu sehen.',
    nightstand: 'Nachttisch-Modus',
    yourLocation: 'Dein Standort',
    selectedPoint: 'Ausgewählter Punkt',
    globeHint:
      'Ziehen zum Drehen · Scrollen zum Zoomen · tippe in der Nähe einer Markierung für eine Stadt oder tippe irgendwo sonst auf den Globus für eine ungefähre Ortszeit',
    geoDenied: ' (Standortzugriff verweigert – es wird nur die Zeitzone des Browsers verwendet)',
    geoUnsupported: ' (Geolokalisierung nicht unterstützt – es wird die Zeitzone des Browsers verwendet)',
    footer:
      'Erstellt mit Three.js. Die Uhrzeit wird mit TimeAPI.io, dem Uhrzeit-Abgleichsdienst von Binance und einem WorldTimeAPI-kompatiblen HTTP-Zeitdienst (time.now) gegengeprüft – im Panel „Zeitquellen" findest du Live-Technikdetails zu jeder einzelnen. Sonnenaufgang, Sonnenuntergang und Mondphase werden lokal anhand von Standard-Sonnen-/Mondformeln berechnet.',
  },
  globe: {
    sun: 'Sonne',
    moon: 'Mond',
  },
  clockCard: {
    pin: 'Anheften',
    pinned: 'Angeheftet',
    approxSolarNote: 'Ungefähre Sonnenzeit (15°/h) – keine offiziellen Zeitzonendaten für diesen genauen Punkt.',
  },
  copyLink: {
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
  },
  hourFormat: {
    label12h: '12h',
    label24h: '24h',
    labelAuto: 'Auto',
    ariaLabel: 'Zeitformat',
  },
  theme: {
    labelLight: 'Hell',
    labelDark: 'Dunkel',
    labelAuto: 'Auto',
    ariaLabel: 'Farbschema',
  },
  citySearch: {
    placeholder: 'Alle Städte durchsuchen…',
    ariaLabel: 'Nach einer Stadt suchen',
    loading: 'Städteindex wird geladen…',
  },
  cityAlarms: {
    alarm: 'Alarm',
    setAlarmFor: (label) => `Alarm stellen für ${label}`,
    notifPermRequired: 'Benachrichtigungsberechtigung ist erforderlich, damit ein Alarm klingeln kann.',
    alarmSetFor: (time) => `Alarm gestellt für ${time}.`,
    alarmSetInexact:
      'Alarm gestellt (kann bis zu ~10 Min. zu spät klingeln – gewähre unten Zugriff auf exakte Alarme für präzises Timing).',
    notifOffNudge: 'Benachrichtigungen sind deaktiviert, daher können Alarme nicht klingeln.',
    enableNotifications: 'Benachrichtigungen aktivieren',
    exactAlarmNudge: 'Zugriff auf exakte Alarme wurde nicht gewährt – Alarme können bis zu ~10 Min. zu spät klingeln.',
    grantExactAlarms: 'Exakte Alarme erlauben',
  },
  nightstand: {
    exitAria: 'Nachttisch-Modus verlassen',
    tapToExit: 'Zum Verlassen irgendwo tippen',
  },
  pinnedCities: {
    unpinAria: (name) => `${name} lösen`,
  },
  moonPhases: {
    newMoon: 'Neumond',
    waxingCrescent: 'Zunehmende Sichel',
    firstQuarter: 'Erstes Viertel',
    waxingGibbous: 'Zunehmender Mond',
    fullMoon: 'Vollmond',
    waningGibbous: 'Abnehmender Mond',
    lastQuarter: 'Letztes Viertel',
    waningCrescent: 'Abnehmende Sichel',
  },
  solarLunar: {
    title: 'Sonne & Mond',
    locationIndependent: 'Die Mondphase ist standortunabhängig',
    selectCityNote:
      'Wähle eine Stadt aus oder erlaube den Standortzugriff, um hier Sonnenauf- und -untergangszeiten zu sehen.',
    polarDay: 'Die Sonne geht heute an diesem Ort nicht unter (Polartag).',
    polarNight: 'Die Sonne geht heute an diesem Ort nicht auf (Polarnacht).',
    sunrise: 'Sonnenaufgang',
    sunset: 'Sonnenuntergang',
    solarNoon: 'Sonnenmittag',
    dayLength: 'Tageslänge',
    illuminated: (percent) => `${percent}% beleuchtet`,
  },
  timeSourcesPanel: {
    title: 'Zeitquellen',
    resync: 'Neu synchronisieren',
    measuring: 'Netzwerkquellen werden gemessen…',
    deviceClockStatus: (ms, direction) =>
      `Die Geräteuhr geht ${ms} ms ${direction === 'ahead' ? 'vor gegenüber' : 'nach gegenüber'} dem Mehrquellen-Konsens.`,
    lastChecked: (time) => ` Zuletzt geprüft ${time}.`,
    failed: 'fehlgeschlagen',
    checking: 'wird geprüft…',
    endpoint: 'Endpunkt:',
    method: 'Methode:',
    protocol: 'Protokoll:',
    http: 'HTTP:',
    contentType: 'Content-Type:',
    size: 'Größe:',
    dns: 'DNS:',
    connect: 'Verbindung:',
    ttfb: 'TTFB:',
    download: 'Download:',
    rawResponse: 'Rohantwort:',
    error: 'Fehler:',
    rttOffset: (latencyMs, offsetMs) => `${latencyMs}ms Umlaufzeit · Abweichung ${offsetMs}ms`,
    footnote:
      'Jede Quelle wird unabhängig abgefragt und mit der Performance API des Browsers gemessen, wobei bei einer unterbrochenen oder langsamen Verbindung einmal erneut versucht wird, bevor sie als fehlgeschlagen markiert wird – mobile Netzwerke lassen regelmäßig einen Versuch scheitern. Die Abweichung jeder Netzwerkquelle schätzt die einfache Latenz als die Hälfte der Umlaufzeit (NTP-Stil) und vergleicht das Ergebnis mit der Geräteuhr. Der zur Korrektur der angezeigten Zeit verwendete Konsenswert ist die mediane Abweichung aller erfolgreich erreichten Quellen, sodass eine einzelne langsame oder fehlerhafte API das Ergebnis nicht verfälschen kann.',
  },
  timeSources: {
    device: {
      name: 'Geräte-Systemuhr',
      protocol: 'Betriebssystemuhr, meist per NTP über dein Gerät/deinen Router synchronisiert',
      description:
        'Die eigene Uhr deines Computers oder Telefons. Moderne Betriebssysteme synchronisieren sie im Hintergrund über NTP/NTS, sodass sie normalerweise auf Millisekunden genau ist, aber abweichen kann, wenn das Gerät lange offline war.',
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: 'Eine dedizierte Drittanbieter-Zeit-REST-API, die als zeitspezifische Ankerquelle in der Liste dient.',
    },
    'binance-time': {
      name: 'Binance-Serverzeit',
      protocol: 'HTTPS REST, Infrastruktur einer Finanzbörse',
      description:
        'Überhaupt keine Zeit-API – der Uhrzeitabgleichs-Endpunkt einer globalen Krypto-Börse, der eigens veröffentlicht wird, damit Trading-Clients Abweichungen erkennen, bevor ihre signierten API-Anfragen abgelehnt werden. Millisekundengenauigkeit und läuft auf einer Infrastruktur mit starkem Anreiz zur Verfügbarkeit, da viel Live-Trading davon abhängt.',
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST, von den obigen Quellen unabhängige Infrastruktur',
      description:
        'Eine kostenlose, schlüssellose, CORS-fähige HTTP-Zeit-/Zeitzonen-API aus derselben WorldTimeAPI-kompatiblen Familie wie das ursprüngliche (inzwischen eingestellte) WorldTimeAPI – ein unabhängiger vierter Datenpunkt.',
    },
  },
}
