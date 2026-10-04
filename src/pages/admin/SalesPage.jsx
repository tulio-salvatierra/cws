import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const CATEGORY = {
  inbound: 'Inbound lead',
  promised: 'Promised action due',
  warm: 'Warm response',
  follow_up: 'Follow-up due',
  new_prospect: 'New prospect',
}

// Some browser privacy extensions block the literal `/api/sales` path. This
// alias reaches the exact same authenticated server handler without changing
// any Sales behavior or authorization boundary.
const SALES_API_PATH = '/api/command-queue'

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Sales request failed.')
  return payload
}

export default function SalesPage() {
  const [sales, setSales] = useState(null)
  const [error, setError] = useState('')
  const [notNow, setNotNow] = useState(() => new Set())
  const [editingLead, setEditingLead] = useState(null)
  const [promise, setPromise] = useState({ lead_id: '', action_text: '', due_on: '' })
  const [discoveryPreparing, setDiscoveryPreparing] = useState(false)
  const [discoveryRunning, setDiscoveryRunning] = useState(false)
  const [preparedDiscovery, setPreparedDiscovery] = useState(null)
  const [discoveryMessage, setDiscoveryMessage] = useState('')
  const [transientBusinesses, setTransientBusinesses] = useState([])
  const [transientActionId, setTransientActionId] = useState('')
  const [candidateActionId, setCandidateActionId] = useState('')

  async function load() {
    try { setError(''); setSales(await request(SALES_API_PATH)) } catch (loadError) { setError(loadError.message) }
  }
  useEffect(() => { load() }, [])

  const items = useMemo(() => sales?.items.filter((item) => !notNow.has(item.id)) || [], [sales, notNow])
  const uniqueLeads = useMemo(() => sales?.leads || [], [sales])

  async function ownerAction(payload) {
    try { await request(SALES_API_PATH, { method: 'POST', body: JSON.stringify(payload) }); await load(); return true } catch (actionError) { setError(actionError.message); return false }
  }

  async function addPromise(event) {
    event.preventDefault()
    try {
      await request(SALES_API_PATH, { method: 'POST', body: JSON.stringify({ action: 'create_promised_action', ...promise }) })
      setPromise({ lead_id: '', action_text: '', due_on: '' })
      await load()
    } catch (actionError) { setError(actionError.message) }
  }

  async function prepareDiscovery() {
    try {
      setError(''); setDiscoveryMessage(''); setTransientBusinesses([]); setDiscoveryPreparing(true)
      const result = await request(SALES_API_PATH, { method: 'POST', body: JSON.stringify({ action: 'prepare_discovery' }) })
      setPreparedDiscovery(result.discovery_authorization || null)
    } catch (actionError) { setError(actionError.message) } finally { setDiscoveryPreparing(false) }
  }

  async function startPreparedDiscovery() {
    if (!preparedDiscovery?.capability) return
    try {
      setError(''); setDiscoveryMessage(''); setDiscoveryRunning(true)
      const result = await request(SALES_API_PATH, { method: 'POST', body: JSON.stringify({ action: 'discover_prospects', discovery_capability: preparedDiscovery.capability }) })
      const businesses = Array.isArray(result.discovery?.businesses) ? result.discovery.businesses : []
      setTransientBusinesses(businesses)
      setDiscoveryMessage(result.replayed
        ? 'This prepared discovery was already processed. Its transient review list is not retained after a replay.'
        : businesses.length
          ? `${businesses.length} business${businesses.length === 1 ? '' : 'es'} ready for your initial review.`
          : 'No eligible businesses were returned for this review pass.')
      setPreparedDiscovery(null)
      await load()
    } catch (actionError) { setError(actionError.message) } finally { setDiscoveryRunning(false) }
  }

  async function actOnCandidate(candidateId, action, detail = {}) {
    try {
      setError(''); setCandidateActionId(candidateId)
      await request(SALES_API_PATH, { method: 'POST', body: JSON.stringify({ action, candidate_id: candidateId, ...detail }) })
      await load()
    } catch (actionError) { setError(actionError.message) } finally { setCandidateActionId('') }
  }

  async function actOnTransientBusiness(business, action) {
    const capability = action === 'investigate_discovered_business' ? business.investigateCapability : business.skipCapability
    if (!capability) return
    try {
      setError(''); setTransientActionId(capability)
      await request(SALES_API_PATH, { method: 'POST', body: JSON.stringify({ action, selection_capability: capability }) })
      setTransientBusinesses((current) => current.filter((item) => item.investigateCapability !== business.investigateCapability))
      await load()
    } catch (actionError) { setError(actionError.message) } finally { setTransientActionId('') }
  }

  if (!sales) return <main className="p-8 text-slate-300">{error ? <><p role="alert">{error}</p><button type="button" onClick={load} className="mt-4 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">Retry</button></> : 'Loading Sales command queue…'}</main>
  const { summary } = sales
  const prospectDiscovery = sales.prospectDiscovery || { configured: false }
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-5xl">
    <Link className="text-sm font-semibold text-orange-300" to="/admin/workspace">← Workspace</Link>
    <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Sales</p>
    <h1 className="mt-3 text-4xl font-semibold">Today’s command queue</h1>
    <p className="mt-3 text-slate-400">Who needs attention, why, and the next useful action. Preparing or viewing a draft never sends email.</p>
    {error && <p role="alert" className="mt-5 text-rose-300">{error}</p>}

    <section aria-label="Today’s Sales progress" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Summary label="New outreach today" value={`${summary.newOutreachToday} / ${summary.dailyTarget}`} />
      <Summary label="Due follow-ups" value={summary.dueFollowUps} />
      <Summary label="Warm responses" value={summary.warmResponses} />
      <Summary label="Promised actions" value={summary.promisedActionsDue} />
    </section>
    {summary.dailyTarget > 0 && <p className="mt-3 text-sm text-slate-400">{summary.newProspectContactsRemaining} new prospect contacts remaining today.</p>}

    {summary.unclassifiedLeads > 0 && <section className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100"><strong>{summary.unclassifiedLeads} historical lead{summary.unclassifiedLeads === 1 ? '' : 's'}</strong> remain unclassified and are intentionally excluded from the queue. <Link className="underline" to="/admin/leads">Review leads</Link> when there is evidence to classify one.</section>}

    {(sales.prospectVerificationRequired || []).length > 0 && <section aria-label="Prospect contact verification" className="mt-6 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5"><h2 className="text-xl font-semibold text-amber-50">Contact verification required</h2><p className="mt-1 text-sm text-amber-100">These legacy findings were based on incomplete HTML evidence. They are not Sales prospects until the contact path is verified.</p><div className="mt-4 grid gap-3">{sales.prospectVerificationRequired.map((candidate) => <VerificationCard key={candidate.id} candidate={candidate} busy={candidateActionId === candidate.id} onVerify={() => actOnCandidate(candidate.id, 'verify_discovery_candidate_contact_path')} />)}</div></section>}

    <section aria-label="Prospects to review" className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Prospects to review</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Research is owner-triggered. Nothing here creates a lead, sends email, or contacts a business.</p></div><button type="button" disabled={!prospectDiscovery.configured || discoveryPreparing || discoveryRunning || Boolean(preparedDiscovery)} onClick={prepareDiscovery} className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{discoveryPreparing ? 'Preparing discovery…' : discoveryRunning ? 'Finding prospects…' : 'Find prospects'}</button></div>
      {!prospectDiscovery.configured && <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">Prospect discovery requires Google Places configuration.</p>}
      {preparedDiscovery && <div role="status" className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4"><p className="font-semibold text-amber-50">Discovery prepared</p><p className="mt-1 text-sm text-amber-100">Starting will use up to {preparedDiscovery.limits?.places_searches ?? 0} Places searches to prepare a temporary owner-review list. It will not inspect websites, create leads, or send email automatically.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={discoveryRunning} onClick={startPreparedDiscovery} className="rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{discoveryRunning ? 'Starting discovery…' : 'Start discovery'}</button><button type="button" disabled={discoveryRunning} onClick={() => setPreparedDiscovery(null)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button></div></div>}
      {discoveryMessage && <p role="status" className="mt-4 text-sm text-emerald-200">{discoveryMessage}</p>}
      {transientBusinesses.length > 0 && <section aria-label="Businesses to review" className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4"><h3 className="text-lg font-semibold text-amber-50">Businesses to review</h3><p className="mt-1 text-sm text-amber-100">This list is temporary. Choose a business to investigate before any website analysis or durable Sales record is created.</p><div className="mt-4 grid gap-3">{transientBusinesses.map((business) => <TransientBusinessCard key={business.investigateCapability} business={business} busy={transientActionId === business.investigateCapability || transientActionId === business.skipCapability} onInvestigate={() => actOnTransientBusiness(business, 'investigate_discovered_business')} onSkip={() => actOnTransientBusiness(business, 'skip_discovered_business')} />)}</div></section>}
      <div className="mt-5 grid gap-4">{(sales.prospects || []).map((candidate) => <ProspectCard key={candidate.id} candidate={candidate} briefConfigured={sales.prospectBrief?.configured} busy={candidateActionId === candidate.id} onPrepareBrief={() => actOnCandidate(candidate.id, 'prepare_prospect_brief')} onRetryBrief={(runId) => actOnCandidate(candidate.id, 'retry_prospect_brief', { retry_of_run_id: runId })} onAdd={() => actOnCandidate(candidate.id, 'add_discovery_candidate_to_sales')} onDismiss={() => actOnCandidate(candidate.id, 'dismiss_discovery_candidate')} />)}{!(sales.prospects || []).length && <p className="text-sm text-slate-400">No verified prospects are waiting for review.</p>}</div>
    </section>

    <section className="mt-8 space-y-3" aria-label="Sales command items">
      {items.map((item) => <CommandItem key={item.id} item={item} onNotNow={() => setNotNow((current) => new Set(current).add(item.id))} onAction={ownerAction} onEdit={() => setEditingLead(item.lead)} />)}
      {!items.length && <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-400">No Sales action is due right now.</div>}
    </section>

    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-lg font-semibold">Record a promised action</h2><p className="mt-1 text-sm text-slate-400">Sales-only: one lead, one action, one due date.</p><form onSubmit={addPromise} className="mt-4 grid gap-3 md:grid-cols-4"><select required value={promise.lead_id} onChange={(event) => setPromise({ ...promise, lead_id: event.target.value })} className="rounded-xl bg-slate-900 p-3"><option value="">Choose lead</option>{uniqueLeads.map((lead) => <option key={lead.id} value={lead.id}>{lead.company || lead.name || lead.email}</option>)}</select><input required value={promise.action_text} onChange={(event) => setPromise({ ...promise, action_text: event.target.value })} placeholder="e.g. Send recommendations" className="rounded-xl bg-slate-900 p-3 md:col-span-2" /><input required type="date" value={promise.due_on} onChange={(event) => setPromise({ ...promise, due_on: event.target.value })} className="rounded-xl bg-slate-900 p-3" /><button className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 md:col-span-4">Save promised action</button></form></section>

    {editingLead && <LeadEditor lead={editingLead} onCancel={() => setEditingLead(null)} onSave={async (changes) => { if (await ownerAction({ action: 'update_lead_sales_state', lead_id: editingLead.id, ...changes })) setEditingLead(null) }} />}
  </div></main>
}

function Summary({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
}

function CommandItem({ item, onNotNow, onAction, onEdit }) {
  const { lead } = item
  const briefContext = item.prospect_brief_context
  const emailPath = item.sendType ? `/admin/leads?lead_id=${encodeURIComponent(lead.id)}&send_type=${encodeURIComponent(item.sendType)}` : '/admin/leads'
  const subtitle = lead.name && lead.company ? `${lead.name} · ${lead.email || lead.phone || 'No public contact recorded'}` : lead.email || lead.phone || 'No public contact recorded'
  return <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">{CATEGORY[item.category]}</p><h2 className="mt-2 text-xl font-semibold">{lead.company || lead.name || lead.email || lead.phone || 'Sales lead'}</h2><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div><button type="button" onClick={onNotNow} className="text-sm text-slate-400 hover:text-white">Not now</button></div><p className="mt-4 text-sm text-slate-300">Reason: {item.reason}</p>{lead.last_contacted_at && <p className="mt-1 text-sm text-slate-400">Last contacted: {new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' }).format(new Date(lead.last_contacted_at))}</p>}<p className="mt-3 font-medium">Recommended action: {item.recommendation}</p>{briefContext && <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4"><BriefLine label="Why contact" value={briefContext.why_contact} /><BriefLine label="Conversation angle" value={briefContext.sales_angle} /><BriefLine label="Suggested opener" value={briefContext.outreach_hook} /></div>}<div className="mt-4 flex flex-wrap gap-3">{item.category === 'promised' ? <button type="button" onClick={() => onAction({ action: 'complete_promised_action', promised_action_id: item.promisedAction.id })} className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950">Complete promised action</button> : item.sendType && lead.email ? <Link to={emailPath} className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950">Prepare email</Link> : null}{lead.phone && <><a href={`tel:${lead.phone}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">Call</a><button type="button" onClick={() => onAction({ action: 'record_call', lead_id: lead.id })} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">Log call</button></>}<button type="button" onClick={onEdit} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">Edit lead</button></div></article>
}

function TransientBusinessCard({ business, busy, onInvestigate, onSkip }) {
  return <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">{business.category}</p><h4 className="mt-2 text-lg font-semibold text-white">{business.businessName}</h4><p className="mt-1 text-sm text-slate-300">{business.locality}</p><div className="mt-4 flex flex-wrap gap-3"><a href={business.websiteUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-3 py-2 text-sm font-semibold text-white">Open website</a><button type="button" disabled={busy} onClick={onInvestigate} className="rounded-full bg-orange-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? 'Working…' : 'Investigate'}</button><button type="button" disabled={busy} onClick={onSkip} className="rounded-full border border-white/20 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Skip</button></div></article>
}

function ProspectCard({ candidate, briefConfigured, busy, onPrepareBrief, onRetryBrief, onAdd, onDismiss }) {
  const facts = Array.isArray(candidate.observed_facts) ? candidate.observed_facts : []
  const ownerSelected = candidate.review_basis === 'owner_selected'
  const hasContact = Boolean(candidate.business_email || candidate.business_phone)
  const briefRun = candidate.prospect_brief
  const brief = briefRun?.output?.brief
  const opportunities = Array.isArray(candidate.opportunities) && candidate.opportunities.length
    ? candidate.opportunities
    : candidate.opportunity
      ? [{ type: 'CONTACT_PATH', observed_fact: null, safe_inference: candidate.opportunity, verification_state: 'legacy' }]
      : []
  return <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">{candidate.category}</p><h3 className="mt-2 text-lg font-semibold">{candidate.business_name}</h3><p className="mt-1 text-sm text-slate-400">{candidate.locality}</p></div>{candidate.possible_duplicate && <p className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100">Possible duplicate</p>}</div>
    <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Why this is here</p>{ownerSelected ? <p className="mt-2 text-sm text-slate-200">You selected this business for review.</p> : <ul className="mt-2 space-y-1 text-sm text-slate-200">{facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}</div>
    {ownerSelected && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">What we found</p><ul className="mt-2 space-y-1 text-sm text-slate-200">{facts.length ? facts.map((fact) => <li key={fact}>✓ {fact}</li>) : <li>Official website selected for bounded review.</li>}{candidate.business_phone && <li>✓ Public phone found</li>}{candidate.business_email && <li>✓ Public email found</li>}</ul></div>}
    <div className="mt-4 space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Evidence-backed signals</p>{opportunities.length ? opportunities.map((opportunity) => <div key={opportunity.type} className="rounded-xl border border-white/10 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">{opportunityLabel(opportunity.type)}</p>{opportunity.observed_fact && <p className="mt-2 text-sm text-slate-200"><span className="font-semibold">Observed:</span> {opportunity.observed_fact}</p>}<p className="mt-2 text-sm text-slate-200"><span className="font-semibold">Owner review:</span> {opportunity.safe_inference}</p><p className="mt-2 text-xs text-slate-400">Evidence state: {evidenceStateLabel(opportunity.verification_state)}</p></div>) : <p className="text-sm text-slate-300">No automated signal was found. This business is here because you selected it for owner review.</p>}</div>
    <fieldset className="mt-4 rounded-xl border border-white/10 p-3"><legend className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Owner check</legend><div className="mt-2 grid gap-2 text-sm text-slate-200"><label className="flex gap-2"><input type="checkbox" /> Mobile experience actually needs improvement</label><label className="flex gap-2"><input type="checkbox" /> Services or value proposition are actually unclear</label><label className="flex gap-2"><input type="checkbox" /> Visual or trust presentation could materially improve</label><label className="flex gap-2"><input type="checkbox" /> Photography or video opportunity</label><label className="flex gap-2"><input type="checkbox" /> I can identify a specific useful CWS improvement</label></div></fieldset>
    {ownerSelected && <ProspectBrief briefRun={briefRun} brief={brief} configured={briefConfigured} busy={busy} onPrepare={onPrepareBrief} onRetry={onRetryBrief} />}
    {candidate.possible_duplicate_reason && <p className="mt-4 text-sm text-amber-100">{candidate.possible_duplicate_reason}</p>}
    <div className="mt-4 flex flex-wrap gap-3 text-sm">{candidate.website_url && <a href={candidate.website_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-3 py-2 font-semibold">Open website</a>}{candidate.business_phone && <span className="rounded-full border border-white/20 px-3 py-2">Phone: {candidate.business_phone}</span>}{candidate.business_email && <span className="rounded-full border border-white/20 px-3 py-2">Email: {candidate.business_email}</span>}</div>
    <div className="mt-4 flex flex-wrap items-center gap-3">{hasContact && !candidate.possible_duplicate ? <button type="button" disabled={busy} onClick={onAdd} className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? 'Saving…' : 'Add to Sales'}</button> : <p className="text-sm text-amber-100">{candidate.possible_duplicate ? 'Review duplicate before adding to Sales.' : 'Contact information needed'}</p>}<button type="button" disabled={busy} onClick={onDismiss} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold disabled:opacity-50">Dismiss</button></div>
  </article>
}

function ProspectBrief({ briefRun, brief, configured, busy, onPrepare, onRetry }) {
  if (!briefRun) return <section className="mt-4 rounded-xl border border-white/10 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Prospect brief</p>{configured ? <><p className="mt-2 text-sm text-slate-300">Prepare concise, evidence-cited Sales intelligence. This does not create a lead or contact the business.</p><button type="button" disabled={busy} onClick={onPrepare} className="mt-3 rounded-full border border-orange-300/50 px-4 py-2 text-sm font-semibold text-orange-100 disabled:opacity-50">{busy ? 'Preparing…' : 'Prepare prospect brief'}</button></> : <p className="mt-2 text-sm text-amber-100">Prospect Brief requires server-side OpenAI configuration.</p>}</section>
  if (briefRun.status !== 'completed' || !brief) return <section className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">Prospect brief</p><p className="mt-2 text-sm text-amber-50">{briefRun.status === 'failed' ? briefRun.error || briefRun.error_message || 'The Prospect Brief could not be prepared.' : 'Prospect Brief preparation is in progress.'}</p>{briefRun.status === 'failed' && <button type="button" disabled={busy} onClick={() => onRetry(briefRun.run_id)} className="mt-3 rounded-full border border-orange-300/50 px-4 py-2 text-sm font-semibold text-orange-100 disabled:opacity-50">{busy ? 'Retrying…' : 'Retry prospect brief'}</button>}</section>
  const recommendation = brief.contact_recommendation?.value || 'OWNER_JUDGMENT'
  const salesAngle = brief.sales_angle?.text || null
  const whyContact = brief.why_contact?.text || brief.why?.text || null
  const whyLabel = recommendation === 'CONTACT' ? 'Why it’s worth contacting' : recommendation === 'SKIP' ? 'Why skip for now' : 'Why owner judgment is needed'
  return <section className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">Prospect brief</p><div className="mt-3 rounded-xl border border-emerald-300/20 bg-slate-950/30 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Contact recommendation</p><p className="mt-1 text-lg font-semibold text-emerald-100">{contactRecommendationLabel(recommendation)}</p><BriefLine label="Best conversation angle" value={salesAngle} /><BriefLine label={whyLabel} value={whyContact} />{brief.outreach_hook?.text && <BriefLine label="Suggested opener" value={brief.outreach_hook.text} />}</div><BriefLine label="Business" value={brief.business?.text} /><BriefLine label="Customer" value={brief.customer?.text} /><BriefList label="What’s working" items={brief.whats_working?.map((item) => item.text)} /><div className="mt-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Opportunities</p>{brief.opportunities?.length ? brief.opportunities.map((item) => <div key={item.observation} className="mt-2 text-sm text-slate-200"><p><span className="font-semibold">Observed:</span> {item.observation}</p><p className="mt-1"><span className="font-semibold">Why:</span> {item.why_it_may_matter}</p><p className="mt-1"><span className="font-semibold">CWS could help:</span> {item.possible_cws_help}</p></div>) : <p className="mt-2 text-sm text-slate-300">No strong CWS opportunity identified from the inspected evidence.</p>}</div></section>
}

function BriefLine({ label, value }) { return value ? <div className="mt-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-200">{value}</p></div> : null }
function BriefList({ label, items }) { return items?.length ? <div className="mt-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">{items.map((item) => <li key={item}>{item}</li>)}</ul></div> : null }
function contactRecommendationLabel(value) { return value === 'OWNER_JUDGMENT' ? 'OWNER JUDGMENT' : value }

function opportunityLabel(type) {
  return ({
    CONTACT_PATH: 'Contact path',
    OFFICIAL_LISTING_LINK_BROKEN: 'Official listing link broken',
    HTTP_NOT_REDIRECTED_TO_HTTPS: 'HTTP not redirected to HTTPS',
    MOBILE_LAYOUT_REVIEW: 'Mobile layout review',
    SERVICE_CLARITY_REVIEW: 'Service clarity review',
  })[type] || 'Website opportunity'
}

function evidenceStateLabel(state) {
  return ({
    verified_gap: 'Verified gap',
    confirmed_public_not_found: 'Public not-found response confirmed',
    confirmed_http_without_https: 'HTTP response confirmed',
    material_overflow_confirmed: 'Material mobile overflow confirmed',
    corroborated_review_signal: 'Raw and rendered evidence corroborated',
    legacy: 'Historical evidence',
  })[state] || 'Verified public-site evidence'
}

function VerificationCard({ candidate, busy, onVerify }) {
  return <article className="rounded-2xl border border-amber-200/20 bg-slate-950/40 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Unverified gap</p><h3 className="mt-2 text-lg font-semibold">{candidate.business_name}</h3><p className="mt-1 text-sm text-amber-100/80">{candidate.locality} · {candidate.category}</p><p className="mt-3 text-sm text-slate-200">The prior contact-path finding cannot be used until S2B checks the public site again.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={onVerify} className="rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? 'Verifying…' : 'Verify contact path'}</button>{candidate.website_url && <a href={candidate.website_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">Open website</a>}</div></article>
}

function LeadEditor({ lead, onCancel, onSave }) {
  const [form, setForm] = useState({ sales_classification: lead.sales_classification || '', response_state: lead.response_state || '', phone: lead.phone || '', locality: lead.locality || '', status: lead.status || 'contacted' })
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5"><form onSubmit={(event) => { event.preventDefault(); onSave(form) }} className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Sales details for {lead.company || lead.name || lead.email}</h2><p className="mt-1 text-sm text-slate-400">Only the queue fields needed for Sales.</p><div className="mt-5 grid gap-3"><select value={form.sales_classification} onChange={(event) => setForm({ ...form, sales_classification: event.target.value })} className="rounded-xl bg-slate-800 p-3"><option value="">Unclassified</option><option value="inbound">Inbound</option><option value="prospect">Prospect</option></select><select value={form.response_state} onChange={(event) => setForm({ ...form, response_state: event.target.value })} className="rounded-xl bg-slate-800 p-3"><option value="">No recorded response</option><option value="no_response">No response</option><option value="warm">Warm / interested</option><option value="neutral">Neutral</option></select><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-xl bg-slate-800 p-3"><option value="new">New</option><option value="contacted">Contacted</option><option value="responded">Responded</option><option value="won">Won</option><option value="lost">Closed / not interested</option><option value="unresponsive">Dormant / revisit later</option></select><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" className="rounded-xl bg-slate-800 p-3" /><input value={form.locality} onChange={(event) => setForm({ ...form, locality: event.target.value })} placeholder="Locality" className="rounded-xl bg-slate-800 p-3" /></div><div className="mt-5 flex gap-3"><button className="rounded-full bg-orange-300 px-4 py-2 font-semibold text-slate-950">Save Sales details</button><button type="button" onClick={onCancel} className="rounded-full border border-white/20 px-4 py-2">Cancel</button></div></form></div>
}
