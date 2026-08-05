import type { Translations } from '../types'

export const pt: Translations = {
  app: {
    title: 'Hora Mundial',
    subtitle: 'Um relógio mundial em tempo real; clique em qualquer cidade para ver a hora dela.',
    nightstand: 'Modo mesa de cabeceira',
    yourLocation: 'Sua localização',
    selectedPoint: 'Ponto selecionado',
    globeHint:
      'Arraste para girar · role para ampliar/reduzir · toque perto de um marcador para ver uma cidade, ou toque em qualquer outro lugar do globo para uma hora local aproximada',
    geoDenied: ' (permissão de localização negada; usando apenas o fuso horário do navegador)',
    geoUnsupported: ' (geolocalização não suportada; usando o fuso horário do navegador)',
    footer:
      'Criado com Three.js. A hora é verificada com o TimeAPI.io, o endpoint de sincronização de relógio da Binance e um serviço HTTP compatível com a WorldTimeAPI (time.now) — veja o painel Fontes de Hora para detalhes técnicos ao vivo de cada uma. O nascer e o pôr do sol e a fase da lua são calculados localmente com fórmulas solares/lunares padrão.',
  },
  globe: {
    sun: 'Sol',
    moon: 'Lua',
  },
  clockCard: {
    pin: 'Fixar',
    pinned: 'Fixado',
    approxSolarNote: 'Hora solar aproximada (15°/h) — sem dados oficiais de fuso horário para este ponto exato.',
  },
  copyLink: {
    copyLink: 'Copiar link',
    copied: 'Copiado!',
  },
  hourFormat: {
    label12h: '12h',
    label24h: '24h',
    labelAuto: 'Auto',
    ariaLabel: 'Formato de hora',
  },
  theme: {
    labelLight: 'Claro',
    labelDark: 'Escuro',
    labelAuto: 'Auto',
    ariaLabel: 'Tema de cor',
  },
  citySearch: {
    placeholder: 'Buscar todas as cidades…',
    ariaLabel: 'Buscar uma cidade',
    loading: 'Carregando índice de cidades…',
  },
  cityAlarms: {
    alarm: 'Alarme',
    setAlarmFor: (label) => `Definir alarme para ${label}`,
    notifPermRequired: 'É necessária permissão de notificações para o alarme tocar.',
    alarmSetFor: (time) => `Alarme definido para ${time}.`,
    alarmSetInexact:
      'Alarme definido (pode tocar com até ~10 min de atraso — conceda acesso a alarmes exatos abaixo para maior precisão).',
    notifOffNudge: 'As notificações estão desativadas, então os alarmes não podem tocar.',
    enableNotifications: 'Ativar notificações',
    exactAlarmNudge: 'O acesso a alarmes exatos não foi concedido — os alarmes podem tocar com até ~10 min de atraso.',
    grantExactAlarms: 'Conceder alarmes exatos',
  },
  nightstand: {
    exitAria: 'Sair do modo mesa de cabeceira',
    tapToExit: 'Toque em qualquer lugar para sair',
  },
  pinnedCities: {
    unpinAria: (name) => `Desafixar ${name}`,
  },
  moonPhases: {
    newMoon: 'Lua nova',
    waxingCrescent: 'Crescente côncava',
    firstQuarter: 'Quarto crescente',
    waxingGibbous: 'Crescente gibosa',
    fullMoon: 'Lua cheia',
    waningGibbous: 'Minguante gibosa',
    lastQuarter: 'Quarto minguante',
    waningCrescent: 'Minguante côncava',
  },
  solarLunar: {
    title: 'Sol e Lua',
    locationIndependent: 'A fase da lua independe da localização',
    selectCityNote:
      'Selecione uma cidade, ou permita o acesso à localização, para ver aqui os horários do nascer e do pôr do sol.',
    polarDay: 'O sol não se põe hoje neste local (dia polar).',
    polarNight: 'O sol não nasce hoje neste local (noite polar).',
    sunrise: 'Nascer do sol',
    sunset: 'Pôr do sol',
    solarNoon: 'Meio-dia solar',
    dayLength: 'Duração do dia',
    illuminated: (percent) => `${percent}% iluminada`,
  },
  timeSourcesPanel: {
    title: 'Fontes de Hora',
    resync: 'Ressincronizar',
    measuring: 'Medindo fontes de rede…',
    deviceClockStatus: (ms, direction) =>
      `O relógio do dispositivo está ${direction === 'ahead' ? 'adiantado em relação ao' : 'atrasado em relação ao'} consenso multi-fonte em ${ms} ms.`,
    lastChecked: (time) => ` Última verificação ${time}.`,
    failed: 'falhou',
    checking: 'verificando…',
    endpoint: 'Endpoint:',
    method: 'Método:',
    protocol: 'Protocolo:',
    http: 'HTTP:',
    contentType: 'Content-Type:',
    size: 'Tamanho:',
    dns: 'DNS:',
    connect: 'Conexão:',
    ttfb: 'TTFB:',
    download: 'Download:',
    rawResponse: 'Resposta bruta:',
    error: 'Erro:',
    rttOffset: (latencyMs, offsetMs) => `${latencyMs}ms ida e volta · desvio ${offsetMs}ms`,
    footnote:
      'Cada fonte é consultada de forma independente e cronometrada com a Performance API do navegador, tentando novamente uma vez em caso de conexão interrompida ou lenta antes de ser marcada como falha — redes móveis costumam falhar uma tentativa de vez em quando. O desvio de cada fonte de rede estima a latência de ida como metade do tempo de ida e volta (estilo NTP) e compara o resultado com o relógio do dispositivo. O valor de consenso usado para corrigir a hora exibida é o desvio mediano entre todas as fontes alcançadas com sucesso, de forma que uma única API lenta ou incorreta não consiga distorcer o resultado.',
  },
  timeSources: {
    device: {
      name: 'Relógio do Sistema',
      protocol: 'Relógio do sistema operacional, geralmente disciplinado por NTP através do seu dispositivo/roteador',
      description:
        'O relógio do seu computador ou telefone. Sistemas operacionais modernos o sincronizam via NTP/NTS em segundo plano, então normalmente é preciso na casa dos milissegundos, mas pode desviar se o dispositivo tiver ficado offline por muito tempo.',
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: 'Uma API REST de hora de terceiros dedicada, mantida como a fonte âncora específica de hora na lista.',
    },
    'binance-time': {
      name: 'Hora do servidor da Binance',
      protocol: 'HTTPS REST, infraestrutura de uma corretora financeira',
      description:
        'Não é uma API de hora — é o endpoint de sincronização de relógio de uma corretora global de criptomoedas, publicado especificamente para que clientes de negociação detectem desvios antes que suas solicitações de API assinadas sejam rejeitadas. Precisão de milissegundos e roda em infraestrutura com forte incentivo à disponibilidade, já que muita negociação ao vivo depende dela.',
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST, infraestrutura independente das fontes acima',
      description:
        'Uma API HTTP de hora/fuso horário gratuita, sem chave e compatível com CORS, da mesma família compatível com WorldTimeAPI que a original (agora descontinuada) WorldTimeAPI — um quarto ponto de dados independente.',
    },
  },
}
