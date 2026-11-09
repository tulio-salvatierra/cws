import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import SignNegocioListoForm from './SignNegocioListoForm'

// Same endpoint and actions as the Sales page; nothing here sends a message.
const SALES_API_PATH = '/api/command-queue'
const STATUS = { new: 'New', contacted: 'Contacted', responded: 'Replied', unresponsive: 'No answer' }
const WEBSITE = { none: 'No website', facebook_only: 'Facebook only', ordering_page: 'Ordering page only', not_linked: 'Site not linked on Google', links_elsewhere: 'Google links elsewhere', outdated: 'Outdated site', own_site: 'Has website' }
const chip = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold'
const WEBSITE_TONE = { own_site: 'border-emerald-300/30 text-emerald-200', none: 'border-orange-300/40 text-orange-200' }

async function postSales(payload) {
  const { data } = await supabase.auth.getSession()
  const response = await fetch(SALES_API_PATH, {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'The lead could not be updated.')
  return body
}

function shortDay(day) {
  if (!day) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))
}

function inDays(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export default function RecentLeads({ summary, onReload }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [followUp, setFollowUp] = useState(null)
  const [signing, setSigning] = useState('')

  if (!summary) return null

  async function run(lead, label, payload) {
    setBusy(lead.id); setError(''); setNotice('')
    try {
      await postSales(payload)
      setNotice(`${lead.business}: ${label}.`)
      setFollowUp(null)
      await onReload()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy('')
    }
  }

  // update_lead_sales_state rewrites phone, locality and classification, so send the current values back.
  const salesState = (lead, changes) => ({ action: 'update_lead_sales_state', lead_id: lead.id, sales_classification: lead.sales_classification, response_state: lead.response_state, status: lead.status, phone: lead.phone, locality: lead.locality, ...changes })

  const button = 'rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:text-white disabled:opacity-50'

  return <section className="mt-9" aria-label="Leads from the last 7 days">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-lg font-semibold text-white">Leads this week</h2>
      <p className="text-sm text-gray-400">{summary.available ? `${summary.total} added or contacted since ${shortDay(summary.since)}` : 'Leads are unavailable right now.'} · <Link to="/admin/sales" className="text-indigo-300">Full queue</Link></p>
    </div>
    {error && <p role="alert" className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-emerald-200">{notice} Recorded only; nothing was sent.</p>}
    {summary.available && !summary.items.length && <p className="mt-3 text-sm text-gray-400">No leads added or contacted in the last 7 days.</p>}
    {!!summary.items.length && <div className="mt-3 space-y-2">
      {summary.items.map((lead) => <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
          <div className="min-w-[14rem] flex-1">
            <h3 className="text-base font-semibold text-white">{lead.business}</h3>
            <p className="mt-0.5 text-xs text-slate-400">{[lead.contact_name, lead.phone, lead.email, lead.address || lead.locality].filter(Boolean).join(' · ') || 'No contact recorded'}</p>
            {(lead.angle || lead.website_status) && <div className="mt-2 flex flex-wrap gap-1.5">
              {lead.angle && <span className={`${chip} border-orange-300/40 bg-orange-300/10 text-orange-100`} title={lead.angle_checked_at ? `Checked ${lead.angle_checked_at}` : undefined}>{lead.angle}</span>}
              {lead.website_status && <span className={`${chip} ${WEBSITE_TONE[lead.website_status] || 'border-white/15 text-slate-300'}`} title={lead.website || undefined}>{WEBSITE[lead.website_status]}</span>}
            </div>}
            {lead.angle_facts?.length ? <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-slate-300">{lead.angle_facts.map((fact) => <li key={fact}>{fact}</li>)}</ul> : lead.hypothesis && <p className="mt-1 text-xs text-slate-300">{lead.hypothesis}</p>}
            {lead.angle_opener && <p className="mt-1.5 text-xs text-slate-200"><span className="font-semibold text-orange-200">Opener: </span>{lead.angle_opener}{lead.angle_upsell ? <span className="text-slate-400"> · Pitch: {lead.angle_upsell}</span> : null}</p>}
          </div>
          <div className="min-w-[9rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">{STATUS[lead.status] || lead.status}{lead.response_state === 'warm' ? ' · Warm' : ''}</p>
            <p className="mt-0.5 text-xs text-slate-400">{lead.contacted_on ? `Last contact ${shortDay(lead.contacted_on)}` : `Added ${shortDay(lead.added_on)}`}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lead.phone && <a href={`tel:${lead.phone}`} className="rounded-xl bg-orange-300 px-3 py-2 text-xs font-semibold text-slate-950">Call</a>}
            {lead.email && <Link to={`/admin/leads?lead_id=${encodeURIComponent(lead.id)}`} className={button}>Email</Link>}
            {lead.phone && <button type="button" disabled={busy === lead.id} className={button} onClick={() => run(lead, 'call logged', { action: 'record_call', lead_id: lead.id })}>Log call</button>}
            <button type="button" disabled={busy === lead.id} className={button} onClick={() => run(lead, 'marked as replied', salesState(lead, { status: 'responded', response_state: 'warm' }))}>Replied</button>
            <button type="button" disabled={busy === lead.id} className={button} onClick={() => { setFollowUp(null); setSigning(signing === lead.id ? '' : lead.id) }}>Signed…</button>
            <button type="button" disabled={busy === lead.id} className={button} onClick={() => setFollowUp({ id: lead.id, text: `Follow up with ${lead.business}`, due: inDays(3) })}>Follow-up…</button>
            <button type="button" disabled={busy === lead.id} className={button} onClick={() => run(lead, 'marked not interested', salesState(lead, { status: 'lost', response_state: 'neutral' }))}>Not interested</button>
          </div>
        </div>
        {signing === lead.id && <SignNegocioListoForm lead={lead} onCancel={() => setSigning('')} onClose={async () => { setSigning(''); try { await onReload() } catch (reloadError) { setError(reloadError.message) } }} />}
        {followUp?.id === lead.id && <form aria-label={`Follow-up for ${lead.business}`} className="mt-3 flex flex-wrap items-end gap-3 border-t border-white/10 pt-3" onSubmit={(event) => { event.preventDefault(); run(lead, `follow-up set for ${shortDay(followUp.due)}`, { action: 'create_promised_action', lead_id: lead.id, action_text: followUp.text, due_on: followUp.due }) }}>
          <label className="min-w-[14rem] flex-1 text-xs text-slate-400">What to do<input required maxLength={500} value={followUp.text} onChange={(event) => setFollowUp({ ...followUp, text: event.target.value })} className="mt-1 block w-full border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <label className="text-xs text-slate-400">Due<input required type="date" value={followUp.due} onChange={(event) => setFollowUp({ ...followUp, due: event.target.value })} className="mt-1 block border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <button disabled={busy === lead.id} className="rounded-xl bg-orange-300 px-3 py-2 text-xs font-semibold text-slate-950">Save follow-up</button>
          <button type="button" className="text-xs text-slate-400 hover:text-white" onClick={() => setFollowUp(null)}>Cancel</button>
        </form>}
      </article>)}
    </div>}
  </section>
}
