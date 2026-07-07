import type { TimeSourceResult } from '../lib/timeSources'

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
        <h2>Time Sources</h2>
        <button className="resync-btn" onClick={onResync}>Resync</button>
      </div>
      <p className="sources-summary">
        {consensusOffset === null
          ? 'Measuring network sources…'
          : `Device clock is ${Math.abs(Math.round(consensusOffset))} ms ${consensusOffset >= 0 ? 'ahead of' : 'behind'} the multi-source consensus.`}
        {lastSyncedAt && (
          <span className="sources-synced-at"> Last checked {new Date(lastSyncedAt).toLocaleTimeString()}.</span>
        )}
      </p>
      <div className="sources-list">
        {results.map((r) => (
          <details key={r.id} className="source-item" open={r.status === 'error'}>
            <summary>
              {statusDot(r.status)}
              <span className="source-name">{r.name}</span>
              {r.status === 'ok' && r.id !== 'device' && (
                <span className="source-metrics">
                  {r.latencyMs}ms rtt · offset {r.offsetMs}ms
                </span>
              )}
              {r.status === 'error' && <span className="source-metrics error">failed</span>}
              {r.status === 'pending' && <span className="source-metrics">checking…</span>}
            </summary>
            <div className="source-detail">
              <div><strong>Endpoint:</strong> {r.url}</div>
              <div><strong>Method:</strong> {r.method}</div>
              <div><strong>Protocol:</strong> {r.protocol}</div>
              <div className="source-desc">{r.description}</div>
              {r.status === 'ok' && r.raw && r.id !== 'device' && (
                <div className="source-raw">
                  <strong>Raw response:</strong>
                  <pre>{r.raw}</pre>
                </div>
              )}
              {r.status === 'error' && <div className="source-error"><strong>Error:</strong> {r.error}</div>}
            </div>
          </details>
        ))}
      </div>
      <p className="sources-footnote">
        Each source is fetched independently and timed with the browser's Performance API, retrying once on a
        dropped or slow connection before it's marked failed — mobile networks routinely stall one attempt in a
        row. The offset for each network source estimates one-way latency as half the round trip (NTP-style) and
        compares the result to your device clock. The consensus value used to correct the displayed time is the
        median offset across all successfully-reached sources, so a single slow or wrong API can't skew the result.
      </p>
    </div>
  )
}
