import { afterEach, describe, expect, it, vi } from 'vitest'
import { readStorage, writeStorage } from './storage'

describe('storage helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('read and write through to localStorage normally', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
      },
    })
    writeStorage('k', 'v')
    expect(readStorage('k')).toBe('v')
  })

  it('degrade to "nothing stored" when the browser blocks storage', () => {
    // What Chrome does with "Block all cookies": the getter itself throws.
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new DOMException('Access is denied for this document.', 'SecurityError')
      },
    })
    expect(readStorage('k')).toBeNull()
    expect(() => writeStorage('k', 'v')).not.toThrow()
  })
})
