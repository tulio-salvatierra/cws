import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import NegocioListoLeadForm from './NegocioListoLeadForm'
import { rememberPopupDismissed, shouldOfferPopup } from '@/lib/negocioListoLead'

const DESKTOP_DELAY_MS = 3000
const MOBILE_FALLBACK_DELAY_MS = 10000
const MOBILE_QUERY = '(max-width: 640px)'

/**
 * Lead popup. Desktop: centered modal after 3 s. Phones: a bottom sheet that opens once the
 * visitor scrolls ~40% of a screen (or after 10 s), so it never covers the page on arrival
 * (Google's intrusive-interstitial guidance). Shown once per session and never after a lead is sent.
 */
export default function NegocioListoPopup({ copy }) {
  const t = copy.popup
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const firstFieldRef = useRef(null)
  const closeRef = useRef(null)
  const lastFocusRef = useRef(null)

  useEffect(() => {
    if (!shouldOfferPopup()) return undefined
    const isPhone = window.matchMedia(MOBILE_QUERY).matches
    const show = () => { if (shouldOfferPopup()) setOpen(true) }
    const timer = window.setTimeout(show, isPhone ? MOBILE_FALLBACK_DELAY_MS : DESKTOP_DELAY_MS)
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.4) { window.clearTimeout(timer); show(); window.removeEventListener('scroll', onScroll) }
    }
    if (isPhone) window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.clearTimeout(timer); window.removeEventListener('scroll', onScroll) }
  }, [])

  const close = useCallback(() => {
    rememberPopupDismissed()
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    lastFocusRef.current = document.activeElement
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => (firstFieldRef.current || closeRef.current)?.focus(), 50)
    const onKey = (event) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      root.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      lastFocusRef.current?.focus?.()
    }
  }, [open, close])

  if (!open) return null

  // Portal to <body> so the dialog sits above the fixed site header's stacking context.
  return createPortal(
    <div className="nl-modal" role="dialog" aria-modal="true" aria-labelledby="nl-popup-title" data-lenis-prevent>
      <div className="nl-modal__backdrop" onClick={close} />
      <div className="nl-modal__card">
        <span className="nl-modal__grip" aria-hidden="true" />
        <button ref={closeRef} type="button" className="nl-modal__close" onClick={close} aria-label={t.close}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
        {done ? (
          <div className="nl-modal__done" role="status">
            <h2 id="nl-popup-title" className="nl-modal__title">{t.doneTitle}</h2>
            <p className="nl-muted">{t.doneBody}</p>
            <a className="nl-btn nl-btn--primary nl-btn--block" href="#planes" onClick={() => setOpen(false)}>{t.doneCta}</a>
          </div>
        ) : (
          <>
            <p className="nl-eyebrow">{t.eyebrow}</p>
            <h2 id="nl-popup-title" className="nl-modal__title">{t.title}</h2>
            <p className="nl-muted nl-modal__sub">{t.sub}</p>
            <NegocioListoLeadForm copy={copy} variant="popup" autoFocusRef={firstFieldRef} onDone={() => setDone(true)} />
            <button type="button" className="nl-link-btn" onClick={close}>{t.notNow}</button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
