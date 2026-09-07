import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../Hooks/useAuth'

const INITIAL_CAPTION = 'Clear strategy. Thoughtful design. Websites built to move your business forward.'
const POLL_INTERVAL_MS = 30_000
const TERMINAL_STATUSES = new Set(['posted', 'error'])

export default function MarketingPage() {
  const [caption, setCaption] = useState(INITIAL_CAPTION)
  const [state, setState] = useState({ loading: true, destination: null, attempt: null, error: '' })
  const [confirming, setConfirming] = useState(false)
  const referenceKeyRef = useRef('')
  const { session } = useAuth()

  const refreshStatus = useCallback(async () => {
    if (!session?.access_token) return

    try {
      const response = await requestMarketing('/api/marketing-linkedin', session.access_token)
      const body = await readJson(response)
      if (!response.ok) throw new Error(body.error || 'Marketing destination could not be verified.')
      setState({ loading: false, destination: body.destination, attempt: body.attempt, error: '' })
    } catch (error) {
      setState(current => ({ ...current, loading: false, destination: null, error: error.message || 'Marketing destination could not be verified.' }))
    }
  }, [session?.access_token])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    if (!state.attempt || TERMINAL_STATUSES.has(state.attempt.provider_status)) return undefined
    const interval = window.setInterval(refreshStatus, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [refreshStatus, state.attempt])

  async function confirm() {
    if (!session?.access_token || confirming || !canConfirm(state, caption)) return

    setConfirming(true)
    setState(current => ({ ...current, error: '' }))
    referenceKeyRef.current ||= `cws-marketing-linkedin:${crypto.randomUUID()}`

    try {
      const response = await requestMarketing('/api/marketing-linkedin', session.access_token, {
        caption,
        reference_key: referenceKeyRef.current,
      })
      const body = await readJson(response)
      if (!response.ok) {
        setState(current => ({ ...current, attempt: body.attempt || current.attempt, error: body.error || 'The post could not be started.' }))
        return
      }
      setState({ loading: false, destination: body.destination, attempt: body.attempt, error: '' })
    } catch (error) {
      setState(current => ({ ...current, error: error.message || 'The post could not be started.' }))
    } finally {
      setConfirming(false)
    }
  }

  const isTerminal = Boolean(state.attempt && TERMINAL_STATUSES.has(state.attempt.provider_status))
  const isLocked = Boolean(state.attempt) || confirming
  const confirmDisabled = !canConfirm(state, caption) || confirming

  return (
    <div className="min-h-full bg-gray-950 px-6 py-8 text-white md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-gray-800 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Marketing</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">One post, clearly previewed.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Review the CWS asset and caption, then explicitly confirm one LinkedIn post.
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${state.destination?.ready ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
            {state.loading ? 'Checking destination…' : state.destination?.ready ? 'Destination verified' : 'Not ready'}
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
          <section aria-labelledby="marketing-composer-heading" className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Compose</p>
                <h2 id="marketing-composer-heading" className="mt-2 text-xl font-semibold text-white">CWS brand introduction</h2>
              </div>
              <span className="rounded-md bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">English</span>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-gray-700 bg-white">
              <img
                src="/images/logo.png"
                alt="Cicero Web Studio wordmark"
                className="aspect-[1.59/1] w-full object-cover"
              />
            </div>

            <label htmlFor="marketing-caption" className="mt-6 block text-sm font-medium text-gray-200">Caption</label>
            <textarea
              id="marketing-caption"
              value={caption}
              onChange={event => setCaption(event.target.value)}
              rows={5}
              disabled={isLocked}
              className="mt-2 w-full resize-y rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
            <p className="mt-2 text-right text-xs text-gray-500">{caption.length} characters</p>

            <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Destination</p>
              <p className="mt-2 text-sm font-medium text-white">LinkedIn — Cicero Web Studio Company Page</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {state.destination?.ready
                  ? `Verified in bundle.social as ${state.destination.channel_name}.`
                  : 'The server verifies the selected Company Page before it can publish.'}
              </p>
            </div>

            <button
              type="button"
              disabled={confirmDisabled}
              onClick={confirm}
              aria-describedby="confirm-note"
              className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {confirming ? 'Starting post…' : state.attempt?.provider_status === 'posted' ? 'Post published' : state.attempt?.provider_status === 'error' ? 'Post needs attention' : state.attempt ? 'Post in progress' : 'Confirm'}
            </button>
            <p id="confirm-note" className="mt-2 text-center text-xs text-gray-500">
              {isTerminal
                ? 'This controlled M2 post is complete. Creating another post is intentionally unavailable here.'
                : 'Confirm is the human authorization. The server re-checks the Company Page before it uploads or publishes.'}
            </p>
            {state.error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{state.error}</p>}
            {state.attempt && (
              <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-sm">
                <p className="font-medium capitalize text-white">Provider status: {state.attempt.provider_status}</p>
                {state.attempt.provider_error && <p className="mt-2 text-rose-300">{state.attempt.provider_error}</p>}
                {state.attempt.provider_permalink && <a className="mt-2 inline-block text-indigo-300 hover:text-indigo-200" href={state.attempt.provider_permalink} target="_blank" rel="noreferrer">Open LinkedIn post →</a>}
                {!isTerminal && <p className="mt-2 text-xs text-gray-500">Checking bundle.social again every 30 seconds while this page stays open.</p>}
              </div>
            )}
          </section>

          <section aria-labelledby="marketing-preview-heading" className="self-start rounded-2xl border border-gray-800 bg-gray-900/50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Live preview</p>
            <h2 id="marketing-preview-heading" className="mt-2 text-xl font-semibold text-white">LinkedIn post</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">Caption edits appear below immediately.</p>

            <article className="mt-6 overflow-hidden rounded-xl border border-gray-700 bg-white text-gray-900 shadow-xl shadow-black/20">
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a66c2] text-sm font-bold text-white">CW</div>
                <div>
                  <p className="text-sm font-semibold">Cicero Web Studio</p>
                  <p className="text-xs text-gray-500">Company · Preview</p>
                </div>
              </div>
              <p data-testid="marketing-preview-caption" className="whitespace-pre-wrap px-4 pb-4 text-sm leading-6">{caption || 'Your caption will appear here.'}</p>
              <img src="/images/logo.png" alt="Cicero Web Studio post preview" className="block aspect-[1.59/1] w-full object-cover" />
              <div className="border-t border-gray-200 px-4 py-3 text-xs font-medium text-gray-500">Like · Comment · Repost · Send</div>
            </article>
          </section>
        </div>
      </div>
    </div>
  )
}

function canConfirm(state, caption) {
  return Boolean(
    state.destination?.ready
    && !state.attempt
    && caption.trim()
    && caption.trim().length <= 3000,
  )
}

function requestMarketing(path, accessToken, body) {
  return fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}
