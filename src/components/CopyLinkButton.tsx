import { useState } from 'react'
import { t } from '../lib/i18n'

/**
 * Copies `url` — built from the card's selection, not read from the address
 * bar, which deliberately doesn't carry the automatic nearest-city default.
 */
export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      className={`clock-card-icon-btn ${copied ? 'active' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard API unavailable or permission denied — nothing useful to do.
        }
      }}
    >
      {copied ? t.copyLink.copied : t.copyLink.copyLink}
    </button>
  )
}
