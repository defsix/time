import type { Translations } from '../types'

export const es: Translations = {
  app: {
    title: 'Hora Mundial',
    subtitle: 'Un reloj mundial en vivo; haz clic en cualquier ciudad para ver su hora.',
    nightstand: 'Mesita de noche',
    yourLocation: 'Tu ubicación',
    selectedPoint: 'Punto seleccionado',
    globeHint:
      'Arrastra para girar · desplázate para hacer zoom · toca cerca de un marcador para ver una ciudad, o toca en cualquier otro punto del globo para una hora local aproximada',
    geoDenied: ' (permiso de ubicación denegado; se usa solo la zona horaria del navegador)',
    geoUnsupported: ' (geolocalización no compatible; se usa la zona horaria del navegador)',
    footer:
      'Creado con Three.js. La hora se verifica con TimeAPI.io, el endpoint de sincronización de reloj de Binance y un servicio HTTP compatible con WorldTimeAPI (time.now); consulta el panel de Fuentes de hora para ver los detalles técnicos en vivo de cada una. El amanecer, el atardecer y la fase lunar se calculan localmente con fórmulas solares/lunares estándar.',
  },
  globe: {
    sun: 'Sol',
    moon: 'Luna',
  },
  clockCard: {
    pin: 'Fijar',
    pinned: 'Fijado',
    approxSolarNote: 'Hora solar aproximada (15°/h); no hay datos oficiales de zona horaria para este punto exacto.',
  },
  copyLink: {
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
  },
  hourFormat: {
    label12h: '12h',
    label24h: '24h',
    labelAuto: 'Auto',
    ariaLabel: 'Formato de hora',
  },
  theme: {
    labelLight: 'Claro',
    labelDark: 'Oscuro',
    labelAuto: 'Auto',
    ariaLabel: 'Tema de color',
  },
  citySearch: {
    placeholder: 'Buscar todas las ciudades…',
    ariaLabel: 'Buscar una ciudad',
    loading: 'Cargando índice de ciudades…',
  },
  cityAlarms: {
    alarm: 'Alarma',
    setAlarmFor: (label) => `Poner alarma para ${label}`,
    notifPermRequired: 'Se necesita permiso de notificaciones para hacer sonar una alarma.',
    alarmSetFor: (time) => `Alarma puesta para las ${time}.`,
    alarmSetInexact:
      'Alarma puesta (puede sonar hasta ~10 min tarde; concede acceso a alarmas exactas abajo para mayor precisión).',
    notifOffNudge: 'Las notificaciones están desactivadas, así que las alarmas no pueden sonar.',
    enableNotifications: 'Activar notificaciones',
    exactAlarmNudge: 'No se ha concedido acceso a alarmas exactas; las alarmas pueden sonar hasta ~10 min tarde.',
    grantExactAlarms: 'Conceder alarmas exactas',
  },
  nightstand: {
    exitAria: 'Salir del modo mesita de noche',
    tapToExit: 'Toca en cualquier parte para salir',
  },
  pinnedCities: {
    unpinAria: (name) => `Dejar de fijar ${name}`,
  },
  moonPhases: {
    newMoon: 'Luna nueva',
    waxingCrescent: 'Creciente iluminante',
    firstQuarter: 'Cuarto creciente',
    waxingGibbous: 'Gibosa creciente',
    fullMoon: 'Luna llena',
    waningGibbous: 'Gibosa menguante',
    lastQuarter: 'Cuarto menguante',
    waningCrescent: 'Creciente menguante',
  },
  solarLunar: {
    title: 'Sol y Luna',
    locationIndependent: 'La fase lunar no depende de la ubicación',
    selectCityNote:
      'Selecciona una ciudad, o permite el acceso a la ubicación, para ver aquí la hora del amanecer y el atardecer.',
    polarDay: 'El sol no se pone hoy en esta ubicación (día polar).',
    polarNight: 'El sol no sale hoy en esta ubicación (noche polar).',
    sunrise: 'Amanecer',
    sunset: 'Atardecer',
    solarNoon: 'Mediodía solar',
    dayLength: 'Duración del día',
    illuminated: (percent) => `${percent}% iluminada`,
  },
  timeSourcesPanel: {
    title: 'Fuentes de hora',
    resync: 'Resincronizar',
    measuring: 'Midiendo fuentes de red…',
    deviceClockStatus: (ms, direction) =>
      `El reloj del dispositivo va ${ms} ms ${direction === 'ahead' ? 'adelantado respecto a' : 'atrasado respecto a'} el consenso multi-fuente.`,
    lastChecked: (time) => ` Última comprobación ${time}.`,
    failed: 'fallo',
    checking: 'comprobando…',
    endpoint: 'Endpoint:',
    method: 'Método:',
    protocol: 'Protocolo:',
    http: 'HTTP:',
    contentType: 'Content-Type:',
    size: 'Tamaño:',
    dns: 'DNS:',
    connect: 'Conexión:',
    ttfb: 'TTFB:',
    download: 'Descarga:',
    rawResponse: 'Respuesta sin procesar:',
    error: 'Error:',
    rttOffset: (latencyMs, offsetMs) => `${latencyMs}ms ida y vuelta · desfase ${offsetMs}ms`,
    footnote:
      'Cada fuente se consulta de forma independiente y se cronometra con la Performance API del navegador, reintentando una vez si la conexión falla o es lenta antes de marcarla como fallida; las redes móviles suelen fallar un intento de vez en cuando. El desfase de cada fuente de red estima la latencia de un solo sentido como la mitad del tiempo de ida y vuelta (estilo NTP) y lo compara con el reloj del dispositivo. El valor de consenso usado para corregir la hora mostrada es el desfase mediano de todas las fuentes alcanzadas con éxito, de modo que una sola API lenta o incorrecta no puede distorsionar el resultado.',
  },
  timeSources: {
    device: {
      name: 'Reloj del sistema',
      protocol: 'Reloj del sistema operativo, normalmente disciplinado por NTP a través de tu dispositivo/router',
      description:
        'El reloj propio de tu ordenador o teléfono. Los sistemas operativos modernos lo sincronizan mediante NTP/NTS en segundo plano, así que suele ser preciso al milisegundo, pero puede desviarse si el dispositivo ha estado mucho tiempo sin conexión.',
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: 'Una API REST de hora de terceros dedicada, mantenida como la fuente ancla específica de hora en la lista.',
    },
    'binance-time': {
      name: 'Hora del servidor de Binance',
      protocol: 'HTTPS REST, infraestructura de una bolsa financiera',
      description:
        'No es una API de hora en absoluto: es el endpoint de sincronización de reloj de una bolsa de criptomonedas global, publicado específicamente para que los clientes de trading detecten desviaciones antes de que sus solicitudes de API firmadas sean rechazadas. Precisión de milisegundos y funciona sobre una infraestructura con un fuerte incentivo de disponibilidad, ya que mucho trading en vivo depende de ella.',
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST, infraestructura independiente de las fuentes anteriores',
      description:
        'Una API HTTP de hora/zona horaria gratuita, sin clave y habilitada para CORS, de la misma familia compatible con WorldTimeAPI que la original (ya retirada) WorldTimeAPI: un cuarto punto de datos independiente.',
    },
  },
}
