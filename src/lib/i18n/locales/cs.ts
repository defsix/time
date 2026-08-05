import type { Translations } from '../types'

export const cs: Translations = {
  app: {
    title: 'Světový čas',
    subtitle: 'Živé světové hodiny — klikněte na libovolné město a zobrazte jeho čas.',
    nightstand: 'Noční režim u postele',
    yourLocation: 'Vaše poloha',
    selectedPoint: 'Vybraný bod',
    globeHint:
      'Tažením otočíte · posouváním přiblížíte · klepnutím poblíž značky zobrazíte město, nebo klepnutím kdekoli jinde na glóbu zobrazíte přibližný místní čas',
    geoDenied: ' (přístup k poloze byl odepřen — používá se pouze časové pásmo prohlížeče)',
    geoUnsupported: ' (geolokace není podporována — používá se časové pásmo prohlížeče)',
    footer:
      'Vytvořeno pomocí Three.js. Čas je porovnáván s TimeAPI.io, koncovým bodem synchronizace hodin Binance a HTTP službou kompatibilní s WorldTimeAPI (time.now) — podrobné technické údaje o každém zdroji najdete v panelu Zdroje času. Východ a západ slunce a měsíční fáze se počítají lokálně podle standardních slunečních/měsíčních vzorců.',
  },
  globe: {
    sun: 'Slunce',
    moon: 'Měsíc',
  },
  clockCard: {
    pin: 'Připnout',
    pinned: 'Připnuto',
    approxSolarNote: 'Přibližný sluneční čas (15°/h) — pro tento přesný bod nejsou k dispozici oficiální údaje o časovém pásmu.',
  },
  copyLink: {
    copyLink: 'Kopírovat odkaz',
    copied: 'Zkopírováno!',
  },
  hourFormat: {
    label12h: '12h',
    label24h: '24h',
    labelAuto: 'Auto',
    ariaLabel: 'Formát času',
  },
  theme: {
    labelLight: 'Světlý',
    labelDark: 'Tmavý',
    labelAuto: 'Auto',
    ariaLabel: 'Barevné téma',
  },
  citySearch: {
    placeholder: 'Hledat všechna města…',
    ariaLabel: 'Hledat město',
    loading: 'Načítání seznamu měst…',
  },
  cityAlarms: {
    alarm: 'Budík',
    setAlarmFor: (label) => `Nastavit budík pro ${label}`,
    notifPermRequired: 'Aby mohl budík zazvonit, je vyžadováno oprávnění k oznámením.',
    alarmSetFor: (time) => `Budík nastaven na ${time}.`,
    alarmSetInexact:
      'Budík nastaven (může zazvonit až s ~10min zpožděním — pro přesné načasování udělte níže přístup k přesným budíkům).',
    notifOffNudge: 'Oznámení jsou vypnutá, takže budíky nemohou zazvonit.',
    enableNotifications: 'Povolit oznámení',
    exactAlarmNudge: 'Přístup k přesným budíkům nebyl udělen — budíky mohou zazvonit až s ~10min zpožděním.',
    grantExactAlarms: 'Udělit přesné budíky',
  },
  nightstand: {
    exitAria: 'Ukončit noční režim',
    tapToExit: 'Klepnutím kdekoli ukončíte',
  },
  pinnedCities: {
    unpinAria: (name) => `Odepnout ${name}`,
  },
  moonPhases: {
    newMoon: 'Nov',
    waxingCrescent: 'Dorůstající srpek',
    firstQuarter: 'První čtvrť',
    waxingGibbous: 'Dorůstající měsíc',
    fullMoon: 'Úplněk',
    waningGibbous: 'Couvající měsíc',
    lastQuarter: 'Poslední čtvrť',
    waningCrescent: 'Couvající srpek',
  },
  solarLunar: {
    title: 'Slunce a Měsíc',
    locationIndependent: 'Měsíční fáze nezávisí na poloze',
    selectCityNote: 'Vyberte město nebo povolte přístup k poloze, abyste zde viděli časy východu a západu slunce.',
    polarDay: 'Slunce dnes na tomto místě nezapadá (polární den).',
    polarNight: 'Slunce dnes na tomto místě nevychází (polární noc).',
    sunrise: 'Východ slunce',
    sunset: 'Západ slunce',
    solarNoon: 'Sluneční poledne',
    dayLength: 'Délka dne',
    illuminated: (percent) => `osvětleno z ${percent} %`,
  },
  timeSourcesPanel: {
    title: 'Zdroje času',
    resync: 'Znovu synchronizovat',
    measuring: 'Měření síťových zdrojů…',
    deviceClockStatus: (ms, direction) =>
      `Hodiny zařízení se ${direction === 'ahead' ? 'předbíhají' : 'opožďují'} oproti konsenzu více zdrojů o ${ms} ms.`,
    lastChecked: (time) => ` Naposledy zkontrolováno ${time}.`,
    failed: 'selhalo',
    checking: 'kontrola…',
    endpoint: 'Koncový bod:',
    method: 'Metoda:',
    protocol: 'Protokol:',
    http: 'HTTP:',
    contentType: 'Content-Type:',
    size: 'Velikost:',
    dns: 'DNS:',
    connect: 'Připojení:',
    ttfb: 'TTFB:',
    download: 'Stažení:',
    rawResponse: 'Nezpracovaná odpověď:',
    error: 'Chyba:',
    rttOffset: (latencyMs, offsetMs) => `${latencyMs}ms odezva · odchylka ${offsetMs}ms`,
    footnote:
      'Každý zdroj je dotazován nezávisle a měřen pomocí Performance API prohlížeče, s jedním opakováním při přerušeném nebo pomalém připojení, než je označen jako neúspěšný — mobilní sítě běžně občas jeden pokus nezvládnou. Odchylka každého síťového zdroje odhaduje jednosměrné zpoždění jako polovinu doby odezvy (ve stylu NTP) a porovnává výsledek s hodinami zařízení. Hodnota konsenzu použitá k opravě zobrazeného času je medián odchylek všech úspěšně dosažených zdrojů, takže jediné pomalé nebo chybné API nemůže výsledek zkreslit.',
  },
  timeSources: {
    device: {
      name: 'Systémové hodiny zařízení',
      protocol: 'Hodiny operačního systému, obvykle synchronizované přes NTP pomocí vašeho zařízení/routeru',
      description:
        'Vlastní hodiny vašeho počítače nebo telefonu. Moderní operační systémy je synchronizují na pozadí pomocí NTP/NTS, takže jsou obvykle přesné na milisekundy, ale mohou se rozejít, pokud bylo zařízení dlouho offline.',
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: 'Vyhrazené REST API času třetí strany, sloužící jako hlavní, časově specifický zdroj v sestavě.',
    },
    'binance-time': {
      name: 'Čas serveru Binance',
      protocol: 'HTTPS REST, infrastruktura finanční burzy',
      description:
        'Vůbec to není API času — je to koncový bod synchronizace hodin globální burzy kryptoměn, zveřejněný speciálně proto, aby obchodní klienti mohli odhalit rozdíl v čase dříve, než jsou jejich podepsané API požadavky odmítnuty. Má přesnost na milisekundy a běží na infrastruktuře se silnou motivací k dostupnosti, protože na ní závisí spousta živého obchodování.',
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST, infrastruktura nezávislá na výše uvedených zdrojích',
      description:
        'Bezplatné HTTP API času/časového pásma bez klíče, s podporou CORS, ze stejné rodiny kompatibilní s WorldTimeAPI jako původní (nyní ukončené) WorldTimeAPI — nezávislý čtvrtý datový bod.',
    },
  },
}
