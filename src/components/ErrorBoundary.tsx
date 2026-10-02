import { Component, type ErrorInfo, type ReactNode } from 'react'
import { t } from '../lib/i18n'

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Last line of defence: without it, any error thrown while rendering
 * unmounts the whole React tree and leaves a blank page. "Start over"
 * reloads without the query string, since a bad share link is the most
 * likely way to end up here — and reloading the same URL would just crash
 * again.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('World Time crashed while rendering', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="error-boundary" role="alert">
        <h1>{t.errorBoundary.title}</h1>
        <p>{t.errorBoundary.body}</p>
        <button onClick={() => window.location.replace(window.location.pathname)}>
          {t.errorBoundary.startOver}
        </button>
      </div>
    )
  }
}
