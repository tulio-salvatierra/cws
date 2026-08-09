const RELOAD_MARKER = 'cws:vite-preload-reload-at'
const RELOAD_COOLDOWN_MS = 10_000

export function installVitePreloadRecovery({
  windowObject = window,
  now = () => Date.now(),
} = {}) {
  windowObject.addEventListener('vite:preloadError', (event) => {
    let recentlyReloaded = false

    try {
      const lastReloadAt = Number(windowObject.sessionStorage.getItem(RELOAD_MARKER) || 0)
      recentlyReloaded = now() - lastReloadAt < RELOAD_COOLDOWN_MS
    } catch {
      // A reload can still recover the app when session storage is unavailable.
    }

    if (recentlyReloaded) return

    event.preventDefault()

    try {
      windowObject.sessionStorage.setItem(RELOAD_MARKER, String(now()))
    } catch {
      // Session storage is only used to prevent a reload loop.
    }

    windowObject.location.reload()
  })
}
