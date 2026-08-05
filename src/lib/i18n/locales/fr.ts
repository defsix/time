import type { Translations } from '../types'

export const fr: Translations = {
  app: {
    title: 'Heure Mondiale',
    subtitle: 'Une horloge mondiale en direct : cliquez sur une ville pour voir son heure.',
    nightstand: 'Mode chevet',
    yourLocation: 'Votre position',
    selectedPoint: 'Point sélectionné',
    globeHint:
      "Faites glisser pour tourner · zoomez avec la molette · touchez près d'un repère pour une ville, ou touchez ailleurs sur le globe pour une heure locale approximative",
    geoDenied: ' (permission de localisation refusée ; utilisation du fuseau horaire du navigateur uniquement)',
    geoUnsupported: ' (géolocalisation non prise en charge ; utilisation du fuseau horaire du navigateur)',
    footer:
      "Réalisé avec Three.js. L'heure est recoupée avec TimeAPI.io, le service de synchronisation d'horloge de Binance et un service HTTP compatible WorldTimeAPI (time.now) — voir le panneau Sources horaires pour les détails techniques en direct de chacune. Le lever, le coucher du soleil et la phase lunaire sont calculés localement à partir de formules solaires/lunaires standards.",
  },
  globe: {
    sun: 'Soleil',
    moon: 'Lune',
  },
  clockCard: {
    pin: 'Épingler',
    pinned: 'Épinglé',
    approxSolarNote: "Heure solaire approximative (15°/h) — aucune donnée de fuseau horaire officielle pour ce point exact.",
  },
  copyLink: {
    copyLink: 'Copier le lien',
    copied: 'Copié !',
  },
  hourFormat: {
    label12h: '12h',
    label24h: '24h',
    labelAuto: 'Auto',
    ariaLabel: 'Format horaire',
  },
  theme: {
    labelLight: 'Clair',
    labelDark: 'Sombre',
    labelAuto: 'Auto',
    ariaLabel: 'Thème de couleur',
  },
  citySearch: {
    placeholder: 'Rechercher une ville…',
    ariaLabel: 'Rechercher une ville',
    loading: "Chargement de l'index des villes…",
  },
  cityAlarms: {
    alarm: 'Alarme',
    setAlarmFor: (label) => `Régler une alarme pour ${label}`,
    notifPermRequired: "L'autorisation des notifications est requise pour faire sonner une alarme.",
    alarmSetFor: (time) => `Alarme réglée pour ${time}.`,
    alarmSetInexact:
      "Alarme réglée (peut sonner jusqu'à ~10 min en retard — accordez l'accès aux alarmes exactes ci-dessous pour plus de précision).",
    notifOffNudge: 'Les notifications sont désactivées, les alarmes ne peuvent donc pas sonner.',
    enableNotifications: 'Activer les notifications',
    exactAlarmNudge: "L'accès aux alarmes exactes n'est pas accordé — les alarmes peuvent sonner jusqu'à ~10 min en retard.",
    grantExactAlarms: 'Accorder les alarmes exactes',
  },
  nightstand: {
    exitAria: 'Quitter le mode chevet',
    tapToExit: "Touchez n'importe où pour quitter",
  },
  pinnedCities: {
    unpinAria: (name) => `Désépingler ${name}`,
  },
  moonPhases: {
    newMoon: 'Nouvelle lune',
    waxingCrescent: 'Premier croissant',
    firstQuarter: 'Premier quartier',
    waxingGibbous: 'Lune gibbeuse croissante',
    fullMoon: 'Pleine lune',
    waningGibbous: 'Lune gibbeuse décroissante',
    lastQuarter: 'Dernier quartier',
    waningCrescent: 'Dernier croissant',
  },
  solarLunar: {
    title: 'Soleil et Lune',
    locationIndependent: 'La phase lunaire ne dépend pas de la position',
    selectCityNote:
      "Sélectionnez une ville, ou autorisez l'accès à la position, pour voir ici les heures de lever et coucher du soleil.",
    polarDay: 'Le soleil ne se couche pas aujourd\'hui à cet endroit (jour polaire).',
    polarNight: 'Le soleil ne se lève pas aujourd\'hui à cet endroit (nuit polaire).',
    sunrise: 'Lever du soleil',
    sunset: 'Coucher du soleil',
    solarNoon: 'Midi solaire',
    dayLength: 'Durée du jour',
    illuminated: (percent) => `${percent}% illuminée`,
  },
  timeSourcesPanel: {
    title: 'Sources horaires',
    resync: 'Resynchroniser',
    measuring: 'Mesure des sources réseau…',
    deviceClockStatus: (ms, direction) =>
      `L'horloge de l'appareil est ${direction === 'ahead' ? 'en avance de' : 'en retard de'} ${ms} ms sur le consensus multi-sources.`,
    lastChecked: (time) => ` Dernière vérification ${time}.`,
    failed: 'échec',
    checking: 'vérification…',
    endpoint: "Point d'accès :",
    method: 'Méthode :',
    protocol: 'Protocole :',
    http: 'HTTP :',
    contentType: 'Content-Type :',
    size: 'Taille :',
    dns: 'DNS :',
    connect: 'Connexion :',
    ttfb: 'TTFB :',
    download: 'Téléchargement :',
    rawResponse: 'Réponse brute :',
    error: 'Erreur :',
    rttOffset: (latencyMs, offsetMs) => `${latencyMs}ms aller-retour · écart ${offsetMs}ms`,
    footnote:
      "Chaque source est interrogée indépendamment et chronométrée avec la Performance API du navigateur, avec une nouvelle tentative en cas de connexion coupée ou lente avant d'être marquée en échec — les réseaux mobiles font régulièrement échouer une tentative sur plusieurs. L'écart de chaque source réseau estime la latence à sens unique comme la moitié de l'aller-retour (façon NTP) et la compare à l'horloge de l'appareil. La valeur de consensus utilisée pour corriger l'heure affichée est l'écart médian de toutes les sources atteintes avec succès, de sorte qu'une seule API lente ou incorrecte ne peut fausser le résultat.",
  },
  timeSources: {
    device: {
      name: "Horloge système de l'appareil",
      protocol: "Horloge du système d'exploitation, généralement synchronisée par NTP via votre appareil/routeur",
      description:
        "L'horloge propre de votre ordinateur ou téléphone. Les systèmes d'exploitation modernes la synchronisent via NTP/NTS en arrière-plan, elle est donc normalement précise à la milliseconde près, mais elle peut dériver si l'appareil est resté longtemps hors ligne.",
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: 'Une API REST horaire tierce dédiée, conservée comme source de référence spécifiquement horaire dans la liste.',
    },
    'binance-time': {
      name: 'Heure du serveur Binance',
      protocol: "HTTPS REST, infrastructure d'une plateforme d'échange financière",
      description:
        "Ce n'est pas du tout une API horaire — c'est le point de synchronisation d'horloge d'une plateforme d'échange de cryptomonnaies mondiale, publié spécifiquement pour que les clients de trading détectent une dérive avant que leurs requêtes API signées ne soient rejetées. Précision à la milliseconde, hébergée sur une infrastructure avec une forte incitation à la disponibilité, car beaucoup de trading en direct en dépend.",
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST, infrastructure indépendante des sources ci-dessus',
      description:
        "Une API HTTP heure/fuseau horaire gratuite, sans clé, compatible CORS, de la même famille compatible WorldTimeAPI que l'original WorldTimeAPI (désormais arrêté) — un quatrième point de donnée indépendant.",
    },
  },
}
