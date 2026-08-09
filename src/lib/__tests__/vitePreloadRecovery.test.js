import { describe, expect, it, vi } from 'vitest'
import { installVitePreloadRecovery } from '../vitePreloadRecovery'

function createWindow() {
  const values = new Map()
  let preloadHandler

  return {
    windowObject: {
      addEventListener: vi.fn((eventName, handler) => {
        if (eventName === 'vite:preloadError') preloadHandler = handler
      }),
      sessionStorage: {
        getItem: vi.fn((key) => values.get(key) || null),
        setItem: vi.fn((key, value) => values.set(key, value)),
      },
      location: { reload: vi.fn() },
    },
    dispatchPreloadError() {
      const event = { preventDefault: vi.fn() }
      preloadHandler(event)
      return event
    },
  }
}

describe('installVitePreloadRecovery', () => {
  it('reloads once when an outdated dynamic chunk fails', () => {
    const browser = createWindow()
    installVitePreloadRecovery({ windowObject: browser.windowObject, now: () => 20_000 })

    const event = browser.dispatchPreloadError()

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(browser.windowObject.location.reload).toHaveBeenCalledOnce()
  })

  it('does not enter a reload loop when the same failure immediately repeats', () => {
    const browser = createWindow()
    installVitePreloadRecovery({ windowObject: browser.windowObject, now: () => 20_000 })

    browser.dispatchPreloadError()
    const repeatedEvent = browser.dispatchPreloadError()

    expect(repeatedEvent.preventDefault).not.toHaveBeenCalled()
    expect(browser.windowObject.location.reload).toHaveBeenCalledOnce()
  })
})
