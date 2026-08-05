import type { Translations } from '../types'

export const ja: Translations = {
  app: {
    title: '世界時計',
    subtitle: 'リアルタイムの世界時計です。都市をクリックするとその地域の時刻が表示されます。',
    nightstand: 'ナイトスタンドモード',
    yourLocation: '現在地',
    selectedPoint: '選択した地点',
    globeHint:
      'ドラッグで回転・スクロールでズーム・マーカー付近をタップすると都市の時刻、地球儀の他の場所をタップするとおおよその現地時刻が表示されます',
    geoDenied: '（位置情報の許可が拒否されたため、ブラウザのタイムゾーンのみを使用しています）',
    geoUnsupported: '（位置情報がサポートされていないため、ブラウザのタイムゾーンを使用しています）',
    footer:
      'Three.js で構築。時刻は TimeAPI.io、Binance の時刻同期エンドポイント、WorldTimeAPI 互換の HTTP 時刻サービス（time.now）と照合しています — 各ソースの技術的な詳細はタイムソースパネルをご覧ください。日の出・日の入り・月相はローカルで標準的な太陽・月の計算式から算出しています。',
  },
  globe: {
    sun: '太陽',
    moon: '月',
  },
  clockCard: {
    pin: 'ピン留め',
    pinned: 'ピン留め済み',
    approxSolarNote: 'おおよその太陽時（15°/時）— この正確な地点の公式なタイムゾーンデータはありません。',
  },
  copyLink: {
    copyLink: 'リンクをコピー',
    copied: 'コピーしました！',
  },
  hourFormat: {
    label12h: '12時間',
    label24h: '24時間',
    labelAuto: '自動',
    ariaLabel: '時刻表示形式',
  },
  theme: {
    labelLight: 'ライト',
    labelDark: 'ダーク',
    labelAuto: '自動',
    ariaLabel: 'カラーテーマ',
  },
  citySearch: {
    placeholder: 'すべての都市を検索…',
    ariaLabel: '都市を検索',
    loading: '都市インデックスを読み込み中…',
  },
  cityAlarms: {
    alarm: 'アラーム',
    setAlarmFor: (label) => `${label} のアラームを設定`,
    notifPermRequired: 'アラームを鳴らすには通知の許可が必要です。',
    alarmSetFor: (time) => `${time} にアラームを設定しました。`,
    alarmSetInexact:
      'アラームを設定しました（最大約10分遅れて鳴る場合があります。正確なタイミングにするには、以下から正確なアラームへのアクセスを許可してください）。',
    notifOffNudge: '通知がオフになっているため、アラームは鳴りません。',
    enableNotifications: '通知を有効にする',
    exactAlarmNudge: '正確なアラームへのアクセスが許可されていません — アラームが最大約10分遅れて鳴ることがあります。',
    grantExactAlarms: '正確なアラームを許可',
  },
  nightstand: {
    exitAria: 'ナイトスタンドモードを終了',
    tapToExit: 'どこかをタップして終了',
  },
  pinnedCities: {
    unpinAria: (name) => `${name} のピン留めを解除`,
  },
  moonPhases: {
    newMoon: '新月',
    waxingCrescent: '三日月',
    firstQuarter: '上弦の月',
    waxingGibbous: '十三夜月',
    fullMoon: '満月',
    waningGibbous: '寝待月',
    lastQuarter: '下弦の月',
    waningCrescent: '有明月',
  },
  solarLunar: {
    title: '太陽と月',
    locationIndependent: '月相は場所に関係ありません',
    selectCityNote: '都市を選択するか、位置情報へのアクセスを許可すると、ここに日の出・日の入りの時刻が表示されます。',
    polarDay: 'この場所では今日は太陽が沈みません（白夜）。',
    polarNight: 'この場所では今日は太陽が昇りません（極夜）。',
    sunrise: '日の出',
    sunset: '日の入り',
    solarNoon: '南中時刻',
    dayLength: '昼の長さ',
    illuminated: (percent) => `輝面比 ${percent}%`,
  },
  timeSourcesPanel: {
    title: 'タイムソース',
    resync: '再同期',
    measuring: 'ネットワークソースを測定中…',
    deviceClockStatus: (ms, direction) =>
      `デバイスの時計は複数ソースの総意より ${ms} ミリ秒${direction === 'ahead' ? '進んでいます' : '遅れています'}。`,
    lastChecked: (time) => ` 最終確認: ${time}。`,
    failed: '失敗',
    checking: '確認中…',
    endpoint: 'エンドポイント:',
    method: 'メソッド:',
    protocol: 'プロトコル:',
    http: 'HTTP:',
    contentType: 'Content-Type:',
    size: 'サイズ:',
    dns: 'DNS:',
    connect: '接続:',
    ttfb: 'TTFB:',
    download: 'ダウンロード:',
    rawResponse: '生のレスポンス:',
    error: 'エラー:',
    rttOffset: (latencyMs, offsetMs) => `往復 ${latencyMs}ms・オフセット ${offsetMs}ms`,
    footnote:
      '各ソースは独立して取得され、ブラウザの Performance API で計測されます。接続が切れたり遅かったりした場合は、失敗と判定される前に一度だけ再試行します — モバイルネットワークでは一度の試行が失敗することがよくあります。各ネットワークソースのオフセットは、往復時間の半分を片道の遅延として推定し（NTP方式）、デバイスの時計と比較します。表示時刻の補正に使われる総意の値は、正常に到達できたすべてのソースの中央値のオフセットなので、1つの遅い、または誤った API が結果を歪めることはありません。',
  },
  timeSources: {
    device: {
      name: 'デバイスのシステム時計',
      protocol: 'OS の時計。通常はお使いの端末やルーターを通じて NTP で同期されます',
      description:
        'お使いのコンピューターやスマートフォン自体の時計です。最近の OS はバックグラウンドで NTP/NTS を使って同期するため、通常はミリ秒単位で正確ですが、端末が長期間オフラインだった場合はずれが生じることがあります。',
    },
    timeapi_io: {
      name: 'TimeAPI.io',
      protocol: 'HTTPS REST',
      description: '専用のサードパーティ時刻 REST API で、ラインナップの中で時刻専用の基準ソースとして採用しています。',
    },
    'binance-time': {
      name: 'Binance のサーバー時刻',
      protocol: 'HTTPS REST、金融取引所のインフラ',
      description:
        'そもそも時刻 API ではありません — 署名付き API リクエストが拒否される前にトレーディングクライアントがずれを検知できるよう公開されている、グローバルな暗号資産取引所の時刻同期エンドポイントです。ミリ秒単位の精度を持ち、多くのライブトレーディングが依存しているため、可用性への強いインセンティブを持つインフラ上で稼働しています。',
    },
    'time-now': {
      name: 'time.now',
      protocol: 'HTTPS REST、上記のソースとは独立したインフラ',
      description:
        '無料でキー不要、CORS 対応の HTTP 時刻/タイムゾーン API で、既に廃止されたオリジナルの WorldTimeAPI と同じ互換ファミリーに属する、独立した4つ目のデータポイントです。',
    },
  },
}
