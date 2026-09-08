import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../Hooks/useAuth'

const INITIAL_CAPTION = 'Clear strategy. Thoughtful design. Websites built to move your business forward.'
const POLL_INTERVAL_MS = 30_000
const TERMINAL_STATUSES = new Set(['posted', 'error'])
const STATUS_DETAILS = {
  preparing: { label: 'Preparing', detail: 'Preparing the publishing request.' },
  scheduled: { label: 'Scheduled', detail: 'bundle.social has accepted the post for delivery.' },
  processing: { label: 'Processing', detail: 'bundle.social is delivering the post.' },
  retrying: { label: 'Retrying', detail: 'bundle.social is retrying delivery.' },
  posted: { label: 'Posted', detail: 'Published. This destination is complete.' },
  error: { label: 'Error', detail: 'This destination ended with an error and remains preserved.' },
}
const VERIFICATION_DETAILS = {
  verified: { label: 'Verified', classes: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' },
  not_verified: { label: 'Not verified', classes: 'border-amber-400/30 bg-amber-400/10 text-amber-100' },
  not_connected: { label: 'Not connected', classes: 'border-amber-400/30 bg-amber-400/10 text-amber-100' },
  error: { label: 'Verification error', classes: 'border-rose-400/30 bg-rose-400/10 text-rose-100' },
}

export default function MarketingPage() {
  const [caption, setCaption] = useState(INITIAL_CAPTION)
  const [state, setState] = useState({
    loading: true,
    destinations: [],
    attempt: null,
    destinationResults: [],
    attemptHistory: [],
    storageReady: false,
    storageError: '',
    canStartNewAttempt: false,
    error: '',
  })
  const [confirming, setConfirming] = useState(false)
  const referenceKeyRef = useRef('')
  const { session } = useAuth()

  const refreshStatus = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const response = await requestMarketing('/api/marketing-linkedin', session.access_token)
      const body = await readJson(response)
      if (!response.ok) throw new Error(body.error || 'Marketing destinations could not be verified.')
      setState({
        loading: false,
        destinations: body.destinations || [],
        attempt: body.attempt,
        destinationResults: body.destination_results || [],
        attemptHistory: body.attempt_history || [],
        storageReady: body.storage_ready === true,
        storageError: body.storage_error || '',
        canStartNewAttempt: body.can_start_new_attempt === true,
        error: '',
      })
    } catch (error) {
      setState(current => ({ ...current, loading: false, destinations: [], error: error.message || 'Marketing destinations could not be verified.' }))
    }
  }, [session?.access_token])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  useEffect(() => {
    if (!state.attempt || state.destinationResults.every(result => TERMINAL_STATUSES.has(result.provider_status))) return undefined
    const interval = window.setInterval(refreshStatus, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [refreshStatus, state.attempt, state.destinationResults])

  async function confirm() {
    if (!session?.access_token || confirming || !canConfirm(state, caption)) return
    setConfirming(true)
    setState(current => ({ ...current, error: '' }))
    referenceKeyRef.current ||= `cws-marketing-m4:${crypto.randomUUID()}`

    try {
      const response = await requestMarketing('/api/marketing-linkedin', session.access_token, {
        caption,
        reference_key: referenceKeyRef.current,
      })
      const body = await readJson(response)
      if (!response.ok) {
        setState(current => ({ ...current, error: body.error || 'The post could not be started.' }))
        return
      }
      setState(current => ({
        loading: false,
        destinations: body.destinations || current.destinations,
        attempt: body.attempt,
        destinationResults: body.destination_results || [],
        attemptHistory: body.attempt_history || current.attemptHistory,
        storageReady: body.storage_ready === true || current.storageReady,
        storageError: body.storage_error || '',
        canStartNewAttempt: body.can_start_new_attempt === true,
        error: '',
      }))
    } catch (error) {
      setState(current => ({ ...current, error: error.message || 'The post could not be started.' }))
    } finally {
      setConfirming(false)
    }
  }

  const allVerified = state.destinations.length === 3 && state.destinations.every(destination => destination.verification_state === 'verified')
  const isLocked = Boolean(state.attempt) || confirming
  const confirmDisabled = !canConfirm(state, caption) || confirming
  const allTerminal = state.destinationResults.length > 0 && state.destinationResults.every(result => TERMINAL_STATUSES.has(result.provider_status))

  return (
    <div className="min-h-full bg-gray-950 px-6 py-8 text-white md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-gray-800 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Marketing</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">One post, clearly prepared.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">Review one CWS asset and caption, then explicitly confirm the verified LinkedIn, Facebook, and Instagram destinations.</p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${allVerified ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
            {state.loading ? 'Checking destinations…' : allVerified ? 'Destinations verified' : 'Destination setup required'}
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
              <img src="/images/logo.png" alt="Cicero Web Studio wordmark" className="aspect-[1.59/1] w-full object-cover" />
            </div>

            <label htmlFor="marketing-caption" className="mt-6 block text-sm font-medium text-gray-200">Caption</label>
            <textarea id="marketing-caption" value={caption} onChange={event => setCaption(event.target.value)} rows={5} disabled={isLocked} className="mt-2 w-full resize-y rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" />
            <p className="mt-2 text-right text-xs text-gray-500">{caption.length} characters</p>

            <section aria-labelledby="marketing-destinations-heading" className="mt-6 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Destinations</p>
              <h3 id="marketing-destinations-heading" className="sr-only">Verified publishing destinations</h3>
              <div className="mt-3 space-y-3">
                {state.destinations.map(destination => <DestinationVerification key={destination.platform} destination={destination} />)}
              </div>
            </section>

            <button type="button" disabled={confirmDisabled} onClick={confirm} aria-describedby="confirm-note" className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-45">
              {confirming ? 'Starting post…' : state.attempt ? 'Post in progress' : 'Confirm three destinations'}
            </button>
            <p id="confirm-note" className="mt-2 text-center text-xs text-gray-500">
              {state.attempt
                ? 'This M4 attempt is locked. Already-posted destinations are never republished.'
                : !state.storageReady
                  ? 'Confirm remains unavailable until secure destination storage is ready.'
                : allVerified
                  ? 'Confirm is the single human authorization for the three displayed destinations.'
                  : 'Confirm remains unavailable until every destination is positively verified by bundle.social.'}
            </p>
            {state.storageError && <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{state.storageError}</p>}
            {state.error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{state.error}</p>}

            {state.attempt && (
              <section aria-labelledby="marketing-results-heading" className="mt-5 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Publish result</p>
                <h3 id="marketing-results-heading" className="mt-2 font-medium text-white">Destination outcomes</h3>
                {allTerminal && <p className="mt-1 text-sm text-gray-400">This attempt is complete. Each destination retains its own outcome.</p>}
                <div className="mt-3 space-y-3">
                  {state.destinationResults.map(result => <DestinationResult key={result.id || result.platform} result={result} />)}
                </div>
                {!allTerminal && <p className="mt-3 text-xs text-gray-500">Checking bundle.social again every 30 seconds. Reopening this page also reconciles unfinished destinations.</p>}
              </section>
            )}

            {state.attemptHistory.length > 0 && (
              <section aria-labelledby="marketing-history-heading" className="mt-5 rounded-xl border border-gray-800 bg-gray-950/40 p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">History</p>
                <h3 id="marketing-history-heading" className="mt-2 font-medium text-white">Previous attempts</h3>
                <div className="mt-3 space-y-3">
                  {state.attemptHistory.map(attempt => (
                    <div key={attempt.id || attempt.reference_key} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                      <p className="font-medium text-white">Provider status: {statusDetail(attempt.provider_status).label}</p>
                      {attempt.provider_error && <p className="mt-2 text-amber-200">{attempt.provider_error}</p>}
                      {attempt.provider_permalink && <a className="mt-2 inline-block text-indigo-300 hover:text-indigo-200" href={attempt.provider_permalink} target="_blank" rel="noreferrer">Open LinkedIn post →</a>}
                      <p className="mt-2 text-xs text-gray-500">Preserved as audit history.</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>

          <section aria-labelledby="marketing-preview-heading" className="self-start rounded-2xl border border-gray-800 bg-gray-900/50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Live preview</p>
            <h2 id="marketing-preview-heading" className="mt-2 text-xl font-semibold text-white">CWS social post</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">Caption edits appear below immediately.</p>
            <article className="mt-6 overflow-hidden rounded-xl border border-gray-700 bg-white text-gray-900 shadow-xl shadow-black/20">
              <div className="flex items-center gap-3 px-4 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a66c2] text-sm font-bold text-white">CW</div><div><p className="text-sm font-semibold">Cicero Web Studio</p><p className="text-xs text-gray-500">Social · Preview</p></div></div>
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

function DestinationVerification({ destination }) {
  const detail = verificationDetail(destination.verification_state)
  return <div className={`rounded-lg border p-3 ${detail.classes}`}><p className="font-medium">{destination.verification_state === 'verified' ? '✓ ' : ''}{destination.name}</p><p className="mt-1 text-xs">{detail.label}{destination.verification_state === 'verified' ? ` — ${destination.channel_name}` : ''}</p>{destination.error && <p className="mt-1 text-xs">{destination.error}</p>}</div>
}

function DestinationResult({ result }) {
  const detail = statusDetail(result.provider_status)
  return <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-sm"><p className="font-medium text-white">{platformName(result.platform)}</p><p className="mt-1 text-gray-300">{detail.label}</p><p className="mt-1 text-xs text-gray-500">{detail.detail}</p>{result.provider_error && <p className="mt-2 text-rose-300">{result.provider_error}</p>}{result.provider_permalink && <a className="mt-2 inline-block text-indigo-300 hover:text-indigo-200" href={result.provider_permalink} target="_blank" rel="noreferrer">View post →</a>}</div>
}

function canConfirm(state, caption) { return Boolean(state.storageReady && state.destinations.length === 3 && state.destinations.every(destination => destination.verification_state === 'verified') && !state.attempt && state.canStartNewAttempt && caption.trim() && caption.trim().length <= 3000) }
function statusDetail(status) { return STATUS_DETAILS[status] || STATUS_DETAILS.processing }
function verificationDetail(state) { return VERIFICATION_DETAILS[state] || VERIFICATION_DETAILS.error }
function platformName(platform) { return platform === 'LINKEDIN' ? 'LinkedIn' : platform === 'FACEBOOK' ? 'Facebook' : 'Instagram' }
function requestMarketing(path, accessToken, body) { return fetch(path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }) }
async function readJson(response) { try { return await response.json() } catch { return {} } }
