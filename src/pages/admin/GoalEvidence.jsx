import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function GoalEvidence({pace,onReload}) {
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [confirmed,setConfirmed]=useState(false)
  const [note,setNote]=useState('')
  async function save(table,payload) {
    setBusy(true);setError('')
    try {
      const result=await supabase.from(table).insert({...payload,workspace_id:pace.workspace_id}).select('*').single()
      if(result.error)throw result.error
      setConfirmed(false);setNote('');await onReload()
    }catch(e){setError(e.message || 'Evidence could not be saved.')}finally{setBusy(false)}
  }
  return <details className="mt-4 text-sm text-gray-200"><summary>Owner · Review signature and subscription evidence</summary>
    <p className="mt-3 text-gray-400">Record verified facts for each agreement. This records evidence only; it does not sign a contract, change a provider subscription, or activate a business decision. Corrections append history. Count one core subscription per client; exclude add-ons and replaced agreements.</p>
    <Link to="/admin/accounting" className="mt-2 inline-block text-indigo-300">Manage client agreements in Accounting</Link>
    {error && <p role="alert" className="mt-3 text-rose-200">{error}</p>}
    {pace.register.map(row=><EvidenceForm key={`${row.id}:${row.evidence?.revision || 'new'}`} row={row} today={pace.business_date} busy={busy} onSave={payload=>save('negocio_listo_evidence',payload)} />)}
    {!pace.register.length && <p className="mt-3 text-gray-400">No Negocio Listo agreements are recorded. Confirm zero only after checking that no signed or active subscriptions are missing.</p>}
    <form className="mt-4 space-y-3 border-t border-gray-700 pt-4" onSubmit={e=>{e.preventDefault();if(confirmed)void save('negocio_listo_completeness',{source_note:note})}}>
      <label className="block"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required /> I checked the full Negocio Listo register: all agreements and signed/active subscriptions are recorded, each core subscription is counted once, and all current statuses and exclusions are correct for {pace.business_date}.</label>
      <label className="block">Completeness check source / reason<textarea required maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} className="mt-2 block w-full rounded bg-gray-800 p-2" /></label>
      <p className="text-xs text-gray-400">Valid for today’s Chicago date and this exact register. New agreements or evidence corrections require another check. Tomorrow, refresh statuses and confirm again.</p>
      <button disabled={busy || !confirmed || !note.trim()} className="rounded border border-indigo-400/40 px-3 py-2">Confirm complete register for today</button>
    </form>
  </details>
}

function EvidenceForm({row,today,busy,onSave}) {
  const old=row.evidence
  const [form,setForm]=useState({counts_toward_goal:old?.counts_toward_goal ?? true,signature_status:old?.signature_status || 'unknown',signed_on:old?.signed_on || '',subscription_status:old?.subscription_status || 'unknown',status_on:today,source_note:''})
  const field=(key,value)=>setForm(current=>({...current,[key]:value}))
  return <form className="mt-4 space-y-3 rounded border border-gray-700 p-3" onSubmit={e=>{e.preventDefault();void onSave({...form,signed_on:form.signature_status==='signed'?form.signed_on:null,agreement_id:row.id,client_id:row.client_id})}}>
    <h3 className="font-semibold">{row.product_name}</h3><p className="break-all text-xs text-gray-400">Agreement {row.id} · Client {row.client_id}</p>
    {old && <p className="text-xs text-gray-400">Last evidence #{old.revision}: {old.signature_status}, {old.subscription_status} as of {old.status_on}. {old.source_note}</p>}
    <label className="block"><input type="checkbox" checked={form.counts_toward_goal} onChange={e=>field('counts_toward_goal',e.target.checked)} /> Counts as this client’s core Negocio Listo subscription</label>
    <label className="block">Signature status<select aria-label={`Signature status ${row.id}`} className="ml-2 rounded bg-gray-800 p-2" value={form.signature_status} onChange={e=>setForm({...form,signature_status:e.target.value,signed_on:e.target.value==='signed'?form.signed_on:''})}><option value="unknown">Unknown</option><option value="unsigned">Verified unsigned</option><option value="signed">Verified signed</option></select></label>
    {form.signature_status==='signed' && <label className="block">Signature date<input required type="date" max={form.status_on} value={form.signed_on} onChange={e=>field('signed_on',e.target.value)} className="ml-2 rounded bg-gray-800 p-2" /></label>}
    <label className="block">Subscription status<select aria-label={`Subscription status ${row.id}`} value={form.subscription_status} onChange={e=>field('subscription_status',e.target.value)} className="ml-2 rounded bg-gray-800 p-2">{['unknown','not_started','active','paused','cancelled','ended'].map(status=><option key={status} value={status}>{status.replaceAll('_',' ')}</option>)}</select></label>
    <label className="block">Status verified on<input required type="date" max={today} value={form.status_on} onChange={e=>field('status_on',e.target.value)} className="ml-2 rounded bg-gray-800 p-2" /></label>
    <label className="block">Evidence source / correction reason<textarea required maxLength={2000} value={form.source_note} onChange={e=>field('source_note',e.target.value)} className="mt-2 block w-full rounded bg-gray-800 p-2" /></label>
    <button disabled={busy || !form.source_note.trim()} className="rounded border border-emerald-400/40 px-3 py-2">Record agreement evidence</button>
  </form>
}
