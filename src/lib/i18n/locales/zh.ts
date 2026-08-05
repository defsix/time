import type { Translations } from '../types'

export const zh: Translations = {
  app: {
    title: '世界时间',
    subtitle: '实时世界时钟，点击任意城市即可查看当地时间。',
    nightstand: '床头模式',
    yourLocation: '您的位置',
    selectedPoint: '已选地点',
    globeHint: '拖动可旋转 · 滚动可缩放 · 点击标记附近可查看城市时间，点击地球仪其他位置可查看大致当地时间',
    geoDenied: '（位置权限被拒绝，仅使用浏览器时区）',
    geoUnsupported: '（不支持地理定位，使用浏览器时区）',
    footer:
      '使用 Three.js 构建。时间与 TimeAPI.io、Binance 的时钟同步接口以及一个兼容 WorldTimeAPI 的 HTTP 时间服务（time.now）进行交叉校验——各来源的实时技术详情请参见“时间来源”面板。日出、日落和月相均在本地根据标准的日月运行公式计算得出。',
  },
  globe: {
    sun: '太阳',
    moon: '月亮',
  },
  clockCard: {
    pin: '置顶',
    pinned: '已置顶',
    approxSolarNote: '大致太阳时间（15°/小时）——此精确地点没有官方时区数据。',
  },
  copyLink: {
    copyLink: '复制链接',
    copied: '已复制！',
  },
  hourFormat: {
    label12h: '12小时制',
    label24h: '24小时制',
    labelAuto: '自动',
    ariaLabel: '时间格式',
  },
  theme: {
    labelLight: '浅色',
    labelDark: '深色',
    labelAuto: '自动',
    ariaLabel: '配色主题',
  },
  citySearch: {
    placeholder: '搜索所有城市…',
    ariaLabel: '搜索城市',
    loading: '正在加载城市索引…',
  },
  cityAlarms: {
    alarm: '闹钟',
    setAlarmFor: (label) => `为${label}设置闹钟`,
    notifPermRequired: '需要通知权限才能让闹钟响起。',
    alarmSetFor: (time) => `闹钟已设置为 ${time}。`,
    alarmSetInexact: '闹钟已设置（可能会晚响约10分钟——如需精确计时，请在下方授予精确闹钟权限）。',
    notifOffNudge: '通知已关闭，闹钟将无法响起。',
    enableNotifications: '启用通知',
    exactAlarmNudge: '尚未授予精确闹钟权限——闹钟可能会晚响约10分钟。',
    grantExactAlarms: '授予精确闹钟权限',
  },
  nightstand: {
    exitAria: '退出床头模式',
    tapToExit: '点击任意位置退出',
  },
  pinnedCities: {
    unpinAria: (name) => `取消置顶${name}`,
  },
  moonPhases: {
    newMoon: '新月',
    waxingCrescent: '娥眉月',
    firstQuarter: '上弦月',
    waxingGibbous: '盈凸月',
    fullMoon: '满月',
    waningGibbous: '亏凸月',
    lastQuarter: '下弦月',
    waningCrescent: '残月',
  },
  solarLunar: {
    title: '日与月',
    locationIndependent: '月相与位置无关',
    selectCityNote: '选择一个城市，或允许访问位置信息，即可在此查看日出日落时间。',
    polarDay: '今天此地太阳不会落下（极昼）。',
    polarNight: '今天此地太阳不会升起（极夜）。',
    sunrise: '日出',
    sunset: '日落',
    solarNoon: '太阳正午',
    dayLength: '白昼时长',
    illuminated: (percent) => `${percent}% 被照亮`,
  },
  timeSourcesPanel: {
    title: '时间来源',
    resync: '重新同步',
    measuring: '正在测量网络来源…',
    deviceClockStatus: (ms, direction) => `设备时钟比多来源共识值${direction === 'ahead' ? '快' : '慢'} ${ms} 毫秒。`,
    lastChecked: (time) => ` 上次检查时间：${time}。`,
    failed: '失败',
    checking: '检查中…',
    endpoint: '端点：',
    method: '方法：',
    protocol: '协议：',
    http: 'HTTP：',
    contentType: 'Content-Type：',
    size: '大小：',
    dns: 'DNS：',
    connect: '连接：',
    ttfb: 'TTFB：',
    download: '下载：',
    rawResponse: '原始响应：',
    error: '错误：',
    rttOffset: (latencyMs, offsetMs) => `往返 ${latencyMs}ms · 偏移 ${offsetMs}ms`,
    footnote:
      '每个来源都独立获取，并使用浏览器的 Performance API 计时；如遇连接中断或缓慢，会在标记为失败前重试一次——移动网络经常会有一次尝试失败。每个网络来源的偏移量将往返时间的一半估算为单程延迟（NTP 方式），并与设备时钟进行比较。用于校正显示时间的共识值，是所有成功到达的来源中的偏移中位数，因此单个缓慢或错误的 API 无法扭曲结果。',
  },
  timeSources: {
    device: {
      name: '设备系统时钟',
      protocol: '操作系统时钟，通常通过您的设备/路由器进行 NTP 校准',
      description:
        '您电脑或手机自身的时钟。现代操作系统会在后台通过 NTP/NTS 进行同步，因此通常精确到毫秒级，但如果设备长时间离线，可能会产生偏差。',
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: '一个专用的第三方时间 REST API，在列表中作为专门的时间基准来源。',
    },
    'binance-time': {
      name: 'Binance 服务器时间',
      protocol: 'HTTPS REST，金融交易所基础设施',
      description:
        '根本不是时间 API——而是一个全球加密货币交易所的时钟同步接口，专门发布出来供交易客户端在其签名的 API 请求被拒绝之前检测时钟偏差。具有毫秒级精度，运行在具有强烈可用性激励的基础设施上，因为大量实时交易都依赖于它。',
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST，与上述来源相互独立的基础设施',
      description:
        '一个免费、无需密钥、支持 CORS 的 HTTP 时间/时区 API，与已停用的原始 WorldTimeAPI 属于同一兼容系列——是第四个独立数据点。',
    },
  },
}
