import { useState } from 'react'

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  return (
    <button
      className={`clock-card-icon-btn ${copied ? 'active' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard API unavailable or permission denied — nothing useful to do.
        }
      }}
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
