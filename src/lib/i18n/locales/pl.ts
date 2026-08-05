import type { Translations } from '../types'

export const pl: Translations = {
  app: {
    title: 'Czas Światowy',
    subtitle: 'Zegar światowy na żywo — kliknij dowolne miasto, aby zobaczyć jego czas.',
    nightstand: 'Tryb szafki nocnej',
    yourLocation: 'Twoja lokalizacja',
    selectedPoint: 'Wybrany punkt',
    globeHint:
      'Przeciągnij, aby obrócić · przewiń, aby przybliżyć · dotknij w pobliżu znacznika, aby zobaczyć miasto, lub dotknij w innym miejscu globu, aby zobaczyć przybliżony czas lokalny',
    geoDenied: ' (odmówiono dostępu do lokalizacji — używana jest tylko strefa czasowa przeglądarki)',
    geoUnsupported: ' (geolokalizacja nieobsługiwana — używana jest strefa czasowa przeglądarki)',
    footer:
      'Stworzone przy użyciu Three.js. Czas jest porównywany z TimeAPI.io, punktem synchronizacji zegara Binance oraz usługą HTTP zgodną z WorldTimeAPI (time.now) — szczegóły techniczne na żywo dla każdego źródła znajdziesz w panelu Źródła czasu. Wschód i zachód słońca oraz faza księżyca są obliczane lokalnie na podstawie standardowych wzorów słonecznych/księżycowych.',
  },
  globe: {
    sun: 'Słońce',
    moon: 'Księżyc',
  },
  clockCard: {
    pin: 'Przypnij',
    pinned: 'Przypięte',
    approxSolarNote: 'Przybliżony czas słoneczny (15°/godz.) — brak oficjalnych danych o strefie czasowej dla tego dokładnego punktu.',
  },
  copyLink: {
    copyLink: 'Kopiuj link',
    copied: 'Skopiowano!',
  },
  hourFormat: {
    label12h: '12h',
    label24h: '24h',
    labelAuto: 'Auto',
    ariaLabel: 'Format godziny',
  },
  theme: {
    labelLight: 'Jasny',
    labelDark: 'Ciemny',
    labelAuto: 'Auto',
    ariaLabel: 'Motyw kolorystyczny',
  },
  citySearch: {
    placeholder: 'Szukaj wszystkich miast…',
    ariaLabel: 'Szukaj miasta',
    loading: 'Ładowanie indeksu miast…',
  },
  cityAlarms: {
    alarm: 'Alarm',
    setAlarmFor: (label) => `Ustaw alarm dla ${label}`,
    notifPermRequired: 'Aby alarm mógł zadzwonić, wymagana jest zgoda na powiadomienia.',
    alarmSetFor: (time) => `Alarm ustawiony na ${time}.`,
    alarmSetInexact:
      'Alarm ustawiony (może zadzwonić z opóźnieniem do ~10 min — przyznaj poniżej dostęp do dokładnych alarmów, aby uzyskać precyzyjne wyzwalanie).',
    notifOffNudge: 'Powiadomienia są wyłączone, więc alarmy nie mogą zadzwonić.',
    enableNotifications: 'Włącz powiadomienia',
    exactAlarmNudge: 'Nie przyznano dostępu do dokładnych alarmów — alarmy mogą dzwonić z opóźnieniem do ~10 min.',
    grantExactAlarms: 'Przyznaj dokładne alarmy',
  },
  nightstand: {
    exitAria: 'Wyjdź z trybu szafki nocnej',
    tapToExit: 'Dotknij w dowolnym miejscu, aby wyjść',
  },
  pinnedCities: {
    unpinAria: (name) => `Odepnij ${name}`,
  },
  moonPhases: {
    newMoon: 'Nów',
    waxingCrescent: 'Przybywający sierp',
    firstQuarter: 'Pierwsza kwadra',
    waxingGibbous: 'Przybywający garbaty',
    fullMoon: 'Pełnia',
    waningGibbous: 'Ubywający garbaty',
    lastQuarter: 'Ostatnia kwadra',
    waningCrescent: 'Ubywający sierp',
  },
  solarLunar: {
    title: 'Słońce i Księżyc',
    locationIndependent: 'Faza księżyca nie zależy od lokalizacji',
    selectCityNote:
      'Wybierz miasto lub zezwól na dostęp do lokalizacji, aby zobaczyć tutaj godziny wschodu i zachodu słońca.',
    polarDay: 'Słońce nie zachodzi dziś w tym miejscu (dzień polarny).',
    polarNight: 'Słońce nie wschodzi dziś w tym miejscu (noc polarna).',
    sunrise: 'Wschód słońca',
    sunset: 'Zachód słońca',
    solarNoon: 'Południe słoneczne',
    dayLength: 'Długość dnia',
    illuminated: (percent) => `oświetlone w ${percent}%`,
  },
  timeSourcesPanel: {
    title: 'Źródła czasu',
    resync: 'Zsynchronizuj ponownie',
    measuring: 'Mierzenie źródeł sieciowych…',
    deviceClockStatus: (ms, direction) =>
      `Zegar urządzenia jest ${direction === 'ahead' ? 'przed' : 'za'} konsensusem wielu źródeł o ${ms} ms.`,
    lastChecked: (time) => ` Ostatnio sprawdzono ${time}.`,
    failed: 'błąd',
    checking: 'sprawdzanie…',
    endpoint: 'Punkt końcowy:',
    method: 'Metoda:',
    protocol: 'Protokół:',
    http: 'HTTP:',
    contentType: 'Content-Type:',
    size: 'Rozmiar:',
    dns: 'DNS:',
    connect: 'Połączenie:',
    ttfb: 'TTFB:',
    download: 'Pobieranie:',
    rawResponse: 'Surowa odpowiedź:',
    error: 'Błąd:',
    rttOffset: (latencyMs, offsetMs) => `${latencyMs}ms czasu odpowiedzi · przesunięcie ${offsetMs}ms`,
    footnote:
      'Każde źródło jest odpytywane niezależnie i mierzone za pomocą Performance API przeglądarki, z jedną ponowną próbą w przypadku zerwanego lub wolnego połączenia, zanim zostanie oznaczone jako nieudane — sieci komórkowe regularnie tracą pojedynczą próbę. Przesunięcie każdego źródła sieciowego szacuje opóźnienie w jedną stronę jako połowę czasu odpowiedzi (w stylu NTP) i porównuje wynik z zegarem urządzenia. Wartość konsensusu używana do korekty wyświetlanego czasu to mediana przesunięć wszystkich pomyślnie osiągniętych źródeł, dzięki czemu pojedyncze wolne lub błędne API nie może zniekształcić wyniku.',
  },
  timeSources: {
    device: {
      name: 'Zegar systemowy urządzenia',
      protocol: 'Zegar systemu operacyjnego, zwykle synchronizowany przez NTP za pośrednictwem urządzenia/routera',
      description:
        'Własny zegar Twojego komputera lub telefonu. Nowoczesne systemy operacyjne synchronizują go w tle przez NTP/NTS, więc zwykle jest dokładny co do milisekundy, ale może się rozjechać, jeśli urządzenie było długo offline.',
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: 'Dedykowane zewnętrzne REST API czasu, pełniące rolę głównego, czasowo dedykowanego źródła w zestawieniu.',
    },
    'binance-time': {
      name: 'Czas serwera Binance',
      protocol: 'HTTPS REST, infrastruktura giełdy finansowej',
      description:
        'To wcale nie jest API czasu — to punkt synchronizacji zegara globalnej giełdy kryptowalut, publikowany specjalnie po to, aby klienci transakcyjni mogli wykryć rozjazd zegara, zanim ich podpisane żądania API zostaną odrzucone. Ma precyzję milisekundową i działa na infrastrukturze z silną motywacją do wysokiej dostępności, ponieważ wiele transakcji na żywo od niej zależy.',
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST, infrastruktura niezależna od powyższych źródeł',
      description:
        'Darmowe, niewymagające klucza, obsługujące CORS API HTTP czasu/strefy czasowej z tej samej rodziny zgodnej z WorldTimeAPI co pierwotne (już wycofane) WorldTimeAPI — niezależny czwarty punkt danych.',
    },
  },
}
