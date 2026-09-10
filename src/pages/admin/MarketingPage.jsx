import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../Hooks/useAuth'

const POLL_INTERVAL_MS = 30_000
const TERMINAL_STATUSES = new Set(['posted', 'error'])
const SLOT_DETAILS = {
  upcoming: { label: 'Upcoming', detail: 'Waiting for an eligible evergreen asset.' },
  ready: { label: 'Ready', detail: 'Ready for the owner to review and confirm.' },
  missed: { label: 'Missed — decision required', detail: 'The scheduled day passed without a successful publication. Choose what happens next.' },
  resolved: { label: 'Decision recorded', detail: 'This occurrence has an owner decision and remains in Marketing history.' },
  processing: { label: 'In delivery', detail: 'bundle.social is reconciling this confirmed post.' },
  posted: { label: 'Posted', detail: 'All three destinations are posted.' },
}
const DESTINATION_DETAILS = {
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
  const [state, setState] = useState({ loading: true, destinations: [], slots: [], attemptHistory: [], storageReady: false, storageError: '', pollAfterMs: null, error: '' })
  const [captions, setCaptions] = useState({})
  const [confirmingSlotKey, setConfirmingSlotKey] = useState('')
  const [resolvingSlotKey, setResolvingSlotKey] = useState('')
  const referenceKeysRef = useRef({})
  const { session } = useAuth()

  const refreshStatus = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const response = await requestMarketing('/api/marketing-linkedin', session.access_token)
      const body = await readJson(response)
      if (!response.ok) throw new Error(body.error || 'Marketing slots could not be loaded.')
      const slots = body.slots || []
      setState({
        loading: false,
        destinations: body.destinations || [],
        slots,
        attemptHistory: body.attempt_history || [],
        storageReady: body.storage_ready === true,
        storageError: body.storage_error || '',
        pollAfterMs: body.poll_after_ms || null,
        error: '',
      })
      setCaptions(current => Object.fromEntries(slots.map(slot => [slot.slot_key, current[slot.slot_key] ?? slot.caption ?? ''])))
    } catch (error) {
      setState(current => ({ ...current, loading: false, destinations: [], slots: [], error: error.message || 'Marketing slots could not be loaded.' }))
    }
  }, [session?.access_token])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  useEffect(() => {
    if (!state.pollAfterMs) return undefined
    const interval = window.setInterval(refreshStatus, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [refreshStatus, state.pollAfterMs])

  async function confirm(slot) {
    const caption = captions[slot.slot_key] ?? slot.caption ?? ''
    if (!session?.access_token || confirmingSlotKey || !canConfirmSlot(state, slot, caption)) return
    const confirmation = slot.state === 'missed'
      ? `Publish now: ${slot.asset.label} to LinkedIn, Facebook, and Instagram?`
      : `Publish ${slot.label} — ${slot.asset.label} — to LinkedIn, Facebook, and Instagram?`
    if (!window.confirm(confirmation)) return
    setConfirmingSlotKey(slot.slot_key)
    setState(current => ({ ...current, error: '' }))
    referenceKeysRef.current[slot.slot_key] ||= `cws-marketing-m5:${crypto.randomUUID()}`

    try {
      const response = await requestMarketing('/api/marketing-linkedin', session.access_token, {
        caption,
        slot_key: slot.slot_key,
        asset_id: slot.asset.id,
        reference_key: referenceKeysRef.current[slot.slot_key],
        owner_confirmation_token: slot.owner_confirmation_token,
      })
      const body = await readJson(response)
      if (!response.ok) throw new Error(body.error || 'The slot could not be started.')
      await refreshStatus()
    } catch (error) {
      setState(current => ({ ...current, error: error.message || 'The slot could not be started.' }))
    } finally {
      setConfirmingSlotKey('')
    }
  }

  async function resolveMissedSlot(slot, action) {
    const caption = captions[slot.slot_key] ?? slot.caption ?? ''
    if (!session?.access_token || resolvingSlotKey || !canResolveMissedSlot(state, slot, caption)) return
    const label = action === 'move' ? 'move this post to the next scheduled slot' : 'skip this occurrence'
    if (!window.confirm(`Do you want to ${label}? This will not publish anything.`)) return
    setResolvingSlotKey(slot.slot_key)
    setState(current => ({ ...current, error: '' }))

    try {
      const response = await requestMarketing('/api/marketing-linkedin', session.access_token, {
        action,
        caption,
        slot_key: slot.slot_key,
        asset_id: slot.asset.id,
        owner_confirmation_token: slot.owner_confirmation_token,
      })
      const body = await readJson(response)
      if (!response.ok) throw new Error(body.error || 'The missed-slot decision could not be saved.')
      await refreshStatus()
    } catch (error) {
      setState(current => ({ ...current, error: error.message || 'The missed-slot decision could not be saved.' }))
    } finally {
      setResolvingSlotKey('')
    }
  }

  const allVerified = state.destinations.length === 3 && state.destinations.every(destination => destination.verification_state === 'verified')
  const nextSlot = state.slots.find(slot => ['missed', 'ready', 'processing'].includes(slot.state)) || state.slots.at(-1)

  return (
    <div className="min-h-full bg-gray-950 px-6 py-8 text-white md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-gray-800 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Marketing</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">This week, clearly prepared.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">Two fixed weekly slots. Each owner confirmation reuses the proven three-destination publisher.</p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${allVerified ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
            {state.loading ? 'Checking destinations…' : allVerified ? 'Destinations verified' : 'Destination setup required'}
          </span>
        </header>

        {nextSlot && <p className="mt-5 text-sm text-gray-400">Next slot: <span className="font-medium text-white">{nextSlot.label} — {nextSlot.weekday}</span></p>}

        <main className="mt-6 grid gap-6 lg:grid-cols-2">
          {state.slots.map(slot => <WeeklySlot
            key={slot.slot_key}
            slot={slot}
            destinations={state.destinations}
            caption={captions[slot.slot_key] ?? slot.caption ?? ''}
            onCaptionChange={value => setCaptions(current => ({ ...current, [slot.slot_key]: value }))}
            onConfirm={() => confirm(slot)}
            onResolve={action => resolveMissedSlot(slot, action)}
            confirming={confirmingSlotKey === slot.slot_key}
            resolving={resolvingSlotKey === slot.slot_key}
            canConfirm={canConfirmSlot(state, slot, captions[slot.slot_key] ?? slot.caption ?? '')}
            canResolve={canResolveMissedSlot(state, slot, captions[slot.slot_key] ?? slot.caption ?? '')}
          />)}
        </main>

        {state.storageError && <p className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{state.storageError}</p>}
        {state.error && <p role="alert" className="mt-6 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{state.error}</p>}

        {state.attemptHistory.length > 0 && <section aria-labelledby="marketing-history-heading" className="mt-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 text-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">History</p>
          <h2 id="marketing-history-heading" className="mt-2 text-xl font-semibold text-white">Previous attempts</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">{state.attemptHistory.map(attempt => <AttemptHistory key={attempt.id || attempt.reference_key} attempt={attempt} />)}</div>
        </section>}

        <section aria-labelledby="marketing-preview-heading" className="mt-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Live preview</p>
          <h2 id="marketing-preview-heading" className="mt-2 text-xl font-semibold text-white">{nextSlot?.asset?.label || 'CWS social post'}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">Caption edits appear below immediately. Marketing never schedules or auto-publishes a missed slot.</p>
          {nextSlot?.asset ? <article className="mt-5 max-w-md overflow-hidden rounded-xl border border-gray-700 bg-white text-gray-900 shadow-xl shadow-black/20">
            <div className="flex items-center gap-3 px-4 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a66c2] text-sm font-bold text-white">CW</div><div><p className="text-sm font-semibold">Cicero Web Studio</p><p className="text-xs text-gray-500">Social · Preview</p></div></div>
            <p data-testid="marketing-preview-caption" className="whitespace-pre-wrap px-4 pb-4 text-sm leading-6">{captions[nextSlot.slot_key] ?? nextSlot.caption ?? 'Your caption will appear here.'}</p>
            <div className="bg-gray-100"><img src={nextSlot.asset.asset_path} alt={`${nextSlot.asset.label} post preview`} className="block max-h-[34rem] w-full object-contain" /></div>
            <div className="border-t border-gray-200 px-4 py-3 text-xs font-medium text-gray-500">Like · Comment · Repost · Send</div>
          </article> : <p className="mt-5 text-sm text-amber-200">Add a verified CWS evergreen offer graphic to prepare a post.</p>}
        </section>
      </div>
    </div>
  )
}

function WeeklySlot({ slot, destinations, caption, onCaptionChange, onConfirm, onResolve, confirming, resolving, canConfirm, canResolve }) {
  const detail = SLOT_DETAILS[slot.state] || SLOT_DETAILS.processing
  const locked = Boolean(slot.attempt) || confirming || resolving || slot.state === 'resolved'
  const fallback = slot.asset?.fallback === true
  return <section aria-labelledby={`${slot.key}-heading`} className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-2xl shadow-black/20 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">{slot.label}</p><h2 id={`${slot.key}-heading`} className="mt-2 text-xl font-semibold text-white">{slot.weekday}</h2><p className="mt-1 text-sm text-gray-400">{slot.state === 'missed' ? `Original scheduled day: ${formatSlotDate(slot.slot_date)}` : formatSlotDate(slot.slot_date)}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${slot.state === 'posted' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : slot.state === 'ready' ? 'border-indigo-400/30 bg-indigo-400/10 text-indigo-100' : slot.state === 'missed' ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' : 'border-gray-700 bg-gray-800 text-gray-300'}`}>{detail.label}</span></div>
    {slot.asset ? <>
      <div className="mt-5 overflow-hidden rounded-xl border border-gray-700 bg-gray-100"><img src={slot.asset.asset_path} alt={slot.asset.label} className="block max-h-[34rem] w-full object-contain" /></div>
      <div className="mt-4 flex items-center gap-2"><h3 className="font-medium text-white">{slot.asset.label}</h3>{slot.asset.price && <span className="text-sm text-gray-400">{slot.asset.price}</span>}{fallback && <span className="rounded bg-amber-400/10 px-2 py-0.5 text-xs text-amber-100">Fallback asset</span>}</div>
      {fallback && <p className="mt-2 text-xs leading-5 text-gray-500">No priced CWS offer creative is currently available in the repository. Add one to replace this fallback in rotation.</p>}
      <label htmlFor={`${slot.key}-caption`} className="mt-5 block text-sm font-medium text-gray-200">Caption</label>
      <textarea id={`${slot.key}-caption`} aria-label={`${slot.label} caption`} value={caption} onChange={event => onCaptionChange(event.target.value)} rows={4} disabled={locked} className="mt-2 w-full resize-y rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-60" />
      <p className="mt-2 text-right text-xs text-gray-500">{caption.length} characters</p>
    </> : <div className="mt-5 rounded-xl border border-dashed border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">No eligible evergreen asset is available for this slot yet.</div>}
    <section aria-label={`${slot.label} destinations`} className="mt-5 rounded-xl border border-gray-800 bg-gray-950/60 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Destinations</p><div className="mt-3 space-y-2">{destinations.map(destination => <DestinationVerification key={destination.platform} destination={destination} />)}</div></section>
    {slot.attempt && <DestinationOutcomes results={slot.destination_results} />}
    {slot.state === 'missed' ? <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <button type="button" disabled={!canConfirm || confirming || resolving} onClick={onConfirm} className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-45">{confirming ? 'Starting post…' : 'Publish now'}</button>
      <button type="button" disabled={!canResolve || confirming || resolving} onClick={() => onResolve('move')} className="rounded-xl border border-indigo-400/50 px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-400/10 disabled:cursor-not-allowed disabled:opacity-45">{resolving ? 'Saving…' : 'Move to next slot'}</button>
      <button type="button" disabled={!canResolve || confirming || resolving} onClick={() => onResolve('skip')} className="rounded-xl border border-gray-700 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-45">Skip</button>
    </div> : <button type="button" disabled={!canConfirm || confirming} onClick={onConfirm} className="mt-6 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-45">{confirming ? 'Starting post…' : slot.attempt ? 'Slot locked' : slot.state === 'resolved' ? 'Decision recorded' : slot.asset && !slot.owner_confirmation_token ? 'Awaiting prior slot' : slot.asset ? `Confirm ${slot.label}` : 'Assets required'}</button>}
    <p className="mt-2 text-center text-xs text-gray-500">{slot.attempt ? 'This slot is locked to its durable Marketing attempt. Posted destinations are never republished.' : slot.state === 'missed' ? 'Publish now still requires the exact owner confirmation. Move and Skip are internal decisions only.' : slot.asset && !slot.owner_confirmation_token ? 'This slot needs its own owner confirmation after the prior slot is complete.' : slot.asset ? 'Confirm is the single human authorization for LinkedIn, Facebook, and Instagram.' : detail.detail}</p>
  </section>
}

function DestinationVerification({ destination }) {
  const detail = VERIFICATION_DETAILS[destination.verification_state] || VERIFICATION_DETAILS.error
  return <div className={`rounded-lg border p-3 text-sm ${detail.classes}`}><p className="font-medium">{destination.verification_state === 'verified' ? '✓ ' : ''}{destination.name}</p><p className="mt-1 text-xs">{detail.label}{destination.verification_state === 'verified' ? ` — ${destination.channel_name}` : ''}</p>{destination.error && <p className="mt-1 text-xs">{destination.error}</p>}</div>
}

function DestinationOutcomes({ results }) {
  const allTerminal = results.length > 0 && results.every(result => TERMINAL_STATUSES.has(result.provider_status))
  return <section aria-label="Destination outcomes" className="mt-5 rounded-xl border border-gray-800 bg-gray-950/60 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Publish result</p>{allTerminal && <p className="mt-2 text-sm text-gray-400">This attempt is complete. Each destination retains its own outcome.</p>}<div className="mt-3 space-y-3">{results.map(result => <DestinationResult key={result.id || result.platform} result={result} />)}</div></section>
}

function DestinationResult({ result }) {
  const detail = DESTINATION_DETAILS[result.provider_status] || DESTINATION_DETAILS.processing
  return <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-sm"><p className="font-medium text-white">{platformName(result.platform)}</p><p className="mt-1 text-gray-300">{detail.label}</p><p className="mt-1 text-xs text-gray-500">{detail.detail}</p>{result.provider_error && <p className="mt-2 text-rose-300">{result.provider_error}</p>}{result.provider_permalink && <a className="mt-2 inline-block text-indigo-300 hover:text-indigo-200" href={result.provider_permalink} target="_blank" rel="noreferrer">View post →</a>}</div>
}

function AttemptHistory({ attempt }) {
  const detail = DESTINATION_DETAILS[attempt.provider_status] || DESTINATION_DETAILS.processing
  return <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3"><p className="font-medium text-white">Provider status: {detail.label}</p>{attempt.provider_error && <p className="mt-2 text-amber-200">{attempt.provider_error}</p>}{attempt.provider_permalink && <a className="mt-2 inline-block text-indigo-300 hover:text-indigo-200" href={attempt.provider_permalink} target="_blank" rel="noreferrer">Open LinkedIn post →</a>}<p className="mt-2 text-xs text-gray-500">Preserved as audit history.</p></div>
}

function canConfirmSlot(state, slot, caption) { return Boolean(state.storageReady && ['ready', 'missed'].includes(slot.state) && slot.asset && slot.owner_confirmation_token && !slot.attempt && state.destinations.length === 3 && state.destinations.every(destination => destination.verification_state === 'verified') && caption.trim() && caption.trim().length <= 3000) }
function canResolveMissedSlot(state, slot, caption) { return Boolean(state.storageReady && slot.state === 'missed' && slot.asset && slot.owner_confirmation_token && !slot.attempt && caption.trim() && caption.trim().length <= 3000) }
function formatSlotDate(date) { return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`)) }
function platformName(platform) { return platform === 'LINKEDIN' ? 'LinkedIn' : platform === 'FACEBOOK' ? 'Facebook' : 'Instagram' }
function requestMarketing(path, accessToken, body) { return fetch(path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }) }
async function readJson(response) { try { return await response.json() } catch { return {} } }
