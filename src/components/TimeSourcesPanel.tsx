import type { TimeSourceResult } from '../lib/timeSources'
import { t } from '../lib/i18n'

interface TimeSourcesPanelProps {
  results: TimeSourceResult[]
  consensusOffset: number | null
  lastSyncedAt: number | null
  onResync: () => void
}

function statusDot(status: TimeSourceResult['status']) {
  const color =
    status === 'ok' ? 'var(--accent-user)' : status === 'error' ? 'var(--accent-error-dot)' : 'var(--accent-warn)'
  return <span className="status-dot" style={{ background: color }} />
}

export default function TimeSourcesPanel({ results, consensusOffset, lastSyncedAt, onResync }: TimeSourcesPanelProps) {
  return (
    <div className="sources-panel">
      <div className="sources-header">
        <h2>{t.timeSourcesPanel.title}</h2>
        <button className="resync-btn" onClick={onResync}>{t.timeSourcesPanel.resync}</button>
      </div>
      <p className="sources-summary">
        {consensusOffset === null
          ? t.timeSourcesPanel.measuring
          : t.timeSourcesPanel.deviceClockStatus(Math.abs(Math.round(consensusOffset)), consensusOffset >= 0 ? 'ahead' : 'behind')}
        {lastSyncedAt && (
          <span className="sources-synced-at">{t.timeSourcesPanel.lastChecked(new Date(lastSyncedAt).toLocaleTimeString())}</span>
        )}
      </p>
      <div className="sources-list">
        {results.map((r) => {
          const source = t.timeSources[r.id as keyof typeof t.timeSources]
          return (
            <details key={r.id} className="source-item" open={r.status === 'error'}>
              <summary>
                {statusDot(r.status)}
                <span className="source-name">{source.name}</span>
                {r.status === 'ok' && r.id !== 'device' && (
                  <span className="source-metrics">{t.timeSourcesPanel.rttOffset(r.latencyMs ?? 0, r.offsetMs ?? 0)}</span>
                )}
                {r.status === 'error' && <span className="source-metrics error">{t.timeSourcesPanel.failed}</span>}
                {r.status === 'pending' && <span className="source-metrics">{t.timeSourcesPanel.checking}</span>}
              </summary>
              <div className="source-detail">
                <div><strong>{t.timeSourcesPanel.endpoint}</strong> {r.url}</div>
                <div><strong>{t.timeSourcesPanel.method}</strong> {r.method}</div>
                <div><strong>{t.timeSourcesPanel.protocol}</strong> {source.protocol}</div>
                <div className="source-desc">{source.description}</div>
                {r.status === 'ok' && r.id !== 'device' && (
                  <div className="source-http-meta">
                    {r.httpStatus !== null && (
                      <span><strong>{t.timeSourcesPanel.http}</strong> {r.httpStatus}</span>
                    )}
                    {r.contentType && (
                      <span><strong>{t.timeSourcesPanel.contentType}</strong> {r.contentType}</span>
                    )}
                    {r.sizeBytes !== null && (
                      <span><strong>{t.timeSourcesPanel.size}</strong> {r.sizeBytes} B</span>
                    )}
                  </div>
                )}
                {r.status === 'ok' && r.timing && (
                  <div className="source-http-meta">
                    <span><strong>{t.timeSourcesPanel.dns}</strong> {Math.round(r.timing.dnsMs)}ms</span>
                    <span><strong>{t.timeSourcesPanel.connect}</strong> {Math.round(r.timing.connectMs)}ms</span>
                    <span><strong>{t.timeSourcesPanel.ttfb}</strong> {Math.round(r.timing.ttfbMs)}ms</span>
                    <span><strong>{t.timeSourcesPanel.download}</strong> {Math.round(r.timing.downloadMs)}ms</span>
                  </div>
                )}
                {r.status === 'ok' && r.raw && r.id !== 'device' && (
                  <div className="source-raw">
                    <strong>{t.timeSourcesPanel.rawResponse}</strong>
                    <pre>{r.raw}</pre>
                  </div>
                )}
                {r.status === 'error' && <div className="source-error"><strong>{t.timeSourcesPanel.error}</strong> {r.error}</div>}
              </div>
            </details>
          )
        })}
      </div>
      <p className="sources-footnote">{t.timeSourcesPanel.footnote}</p>
    </div>
  )
}
