import { useState } from 'react'
import { supabase } from '../../lib/supabase'
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const blank=()=>({id:crypto.randomUUID(),hours:'',worked_on:today(),notes:''})

export default function ProjectTime({project,entries=[],agreements=[],canManage=false,onReload,onAction,busy}) {
  const [form,setForm]=useState(blank)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [removing,setRemoving]=useState(null)
  const [agreement,setAgreement]=useState(project.service_agreement_id || '')
  const rows=entries.filter(row=>row.project_id===project.id && row.workspace_id===project.workspace_id)
  async function record(event) {
    event.preventDefault();setError('')
    if(!/^\d+$/.test(form.hours) || Number(form.hours)<1 || Number(form.hours)>9999){setError('Enter whole hours from 1 to 9,999. Fractions are not rounded.');return}
    setSaving(true)
    try {
      const result=await supabase.from('project_time_entries').insert({...form,hours:Number(form.hours),project_id:project.id,workspace_id:project.workspace_id}).select('id').single()
      if(result.error) throw result.error
      setForm(blank());await onReload()
    } catch(e){setError(e.code==='23505'?'This entry was already recorded. Reload before retrying.':e.message || 'Hours could not be recorded.')}
    finally{setSaving(false)}
  }
  async function remove() {
    setSaving(true);setError('')
    try {
      const result=await supabase.from('project_time_entries').delete().eq('id',removing.id).eq('workspace_id',project.workspace_id).eq('project_id',project.id).select('id')
      if(result.error) throw result.error
      if(!result.data?.length) throw new Error('Entry changed or owner access is unavailable. Reload before retrying.')
      setRemoving(null);await onReload()
    }catch(e){setError(e.message || 'Entry could not be removed.')}finally{setSaving(false)}
  }
  return <section className="mt-8 rounded-3xl border border-white/10 p-5" aria-label="Project hours">
    <h2 className="text-xl font-semibold">Project hours</h2>
    <p className="mt-2 text-sm text-slate-300">{project.actual_hours==null?'No hours recorded.':`${project.actual_hours} whole hours recorded.`} Owner-entered entries feed the financial hourly rate. No timer or inferred time.</p>
    {error && <p role="alert" className="mt-3 text-rose-200">{error}</p>}
    {canManage && <form onSubmit={record} className="mt-4 space-y-3">
      <label className="block text-sm">Whole hours<input required type="text" inputMode="numeric" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})} className="ml-3 rounded bg-slate-900 p-2" /></label>
      <label className="block text-sm">Work date<input required type="date" max={today()} value={form.worked_on} onChange={e=>setForm({...form,worked_on:e.target.value})} className="ml-3 rounded bg-slate-900 p-2" /></label>
      <label className="block text-sm">Time notes<textarea maxLength={2000} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="mt-2 block w-full rounded bg-slate-900 p-2" /></label>
      <button disabled={saving || busy} className="rounded border border-emerald-300/40 px-3 py-2 text-sm text-emerald-100">Record hours</button>
    </form>}
    <div className="mt-4 space-y-2">{rows.map(row=><div key={row.id} className="rounded border border-white/10 p-3 text-sm"><p>{row.worked_on} · {row.hours} whole hours</p><p className="whitespace-pre-wrap text-slate-400">{row.notes}</p>{canManage && <button disabled={saving} className="mt-2 text-orange-200" onClick={()=>setRemoving(row)}>Remove entry</button>}</div>)}</div>
    {removing && <div role="group" aria-label="Confirm time correction" className="mt-3 text-sm"><p>Remove {removing.hours} hours dated {removing.worked_on}? The project total will be recalculated.</p><button disabled={saving} className="mr-4 mt-2 text-orange-200" onClick={remove}>Confirm remove entry</button><button disabled={saving} onClick={()=>setRemoving(null)}>Cancel removal</button></div>}
    <h3 className="mt-6 font-semibold">Lifecycle agreement</h3>
    <p className="mt-2 text-sm text-slate-400">Explicitly links this project to a recorded client agreement. It does not create, sign, launch, or bill an agreement.</p>
    {canManage ? <div className="mt-3 flex flex-wrap gap-3"><select aria-label="Linked client agreement" className="rounded bg-slate-900 p-2" value={agreement} onChange={e=>setAgreement(e.target.value)}><option value="">No linked agreement</option>{agreements.filter(a=>a.client_id===project.client_id && a.workspace_id===project.workspace_id).map(a=><option key={a.id} value={a.id}>{a.product_name}</option>)}</select><button disabled={busy || saving} className="rounded border border-white/20 px-3 py-2 text-sm" onClick={()=>onAction({action:'link_project_agreement',project_id:project.id,agreement_id:agreement || null})}>Save agreement link</button></div> : <p className="mt-2 text-sm">{project.service_agreement_id?'Agreement linked.':'No agreement linked.'}</p>}
  </section>
}
