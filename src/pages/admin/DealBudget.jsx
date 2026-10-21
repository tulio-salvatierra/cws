import {useState} from 'react'
import {supabase} from '../../lib/supabase'

const numbers=['setup_hours','monthly_hours','setup_cost_cents','monthly_cost_cents','available_hours','committed_hours','deal_window_hours']
const labels={setup_hours:'Full setup labor hours',monthly_hours:'Recurring labor hours per month',setup_cost_cents:'All setup direct costs (cents)',monthly_cost_cents:'All recurring direct costs per month (cents)',available_hours:'Total available work hours in window',committed_hours:'Other committed hours in window (exclude this deal)',deal_window_hours:'This deal’s labor hours in window'}
export default function DealBudget({item,workspaceId,today,onReload}) {
 const old=item.budget
 const [form,setForm]=useState({...Object.fromEntries(numbers.map(k=>[k,old?.[k] ?? ''])),window_start:old?.window_start>=today?old.window_start:'',window_end:old?.window_end>=today?old.window_end:'',source_note:'',labor_cost_complete:false,capacity_complete:false})
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const change=(k,value)=>setForm({...form,[k]:value})
 async function save(e){
  e.preventDefault();setError('')
  if(numbers.some(k=>!/^\d+$/.test(String(form[k])))){setError('Enter whole hours and integer cents explicitly, including zero where verified.');return}
  if(!form.labor_cost_complete || !form.capacity_complete)return
  setBusy(true)
  try {
   const result=await supabase.from('negocio_listo_deal_budgets').insert({...form,...Object.fromEntries(numbers.map(k=>[k,Number(form[k])])),workspace_id:workspaceId,agreement_id:item.agreement.id,client_id:item.agreement.client_id,verified_on:today,snapshot:item.budget_snapshot}).select('*').single()
   if(result.error)throw result.error
   await onReload()
  }catch(err){setError(err.message || 'Budget could not be recorded.')}finally{setBusy(false)}
 }
 return <details className="mt-4 text-sm text-gray-200"><summary>Owner · Record labor, costs and dated capacity</summary>
  <p className="mt-3 text-gray-400">Budget the full setup and every month of the recorded term, including labor already spent and all direct costs. Hours are whole numbers; costs are integer cents. Zero must be entered explicitly. These are estimates, not actual time, payments or reserved capacity. Link exactly one Operations project first.</p>
  {old && <p className="mt-2 text-xs">Last budget #{old.revision}, reviewed {old.verified_on}: {old.source_note}</p>}
  <details className="mt-3 text-xs text-gray-400"><summary>Exact records used for this review</summary><div className="mt-2 max-h-64 overflow-auto">{item.budget_snapshot.agreements.map(a=><p key={a.id} className="mt-2">{a.product_name} · Agreement {a.id} · setup {a.setup_cents} cents, monthly {a.monthly_cents} cents, {a.term_months} months. {a.plan?`Other recorded plan: ${a.plan.setup_hours} setup hours + ${a.plan.monthly_hours} hours/month; ${a.plan.setup_cost_cents} setup cost cents + ${a.plan.monthly_cost_cents} cost cents/month; ${a.plan.deal_window_hours} hours in ${a.plan.window_start}–${a.plan.window_end}; available ${a.plan.available_hours}, other committed ${a.plan.committed_hours} hours.`:'No other-deal plan to review here.'}</p>)}{item.budget_snapshot.projects.map(p=><p key={p.id} className="mt-2">Project {p.id} · {p.status} · {p.actual_hours ?? 'unknown'} hours spent · agreement {p.service_agreement_id || 'not linked'}.</p>)}{item.budget_snapshot.costs.map(c=><p key={c.id} className="mt-2">Recorded cost {c.id} · project {c.operations_project_id} · {c.amount_cents} cents · incurred {c.incurred_on}.</p>)}</div></details>
  <form onSubmit={save} className="mt-3 space-y-3">
   {numbers.map(k=><label key={k} className="block">{labels[k]}<input required type="text" inputMode="numeric" className="mt-1 block rounded bg-gray-800 p-2" value={form[k]} onChange={e=>change(k,e.target.value)}/></label>)}
   <label className="block">Capacity window start<input required type="date" min={today} value={form.window_start} onChange={e=>change('window_start',e.target.value)} className="ml-2 rounded bg-gray-800 p-2"/></label>
   <label className="block">Capacity window end<input required type="date" min={form.window_start || today} value={form.window_end} onChange={e=>change('window_end',e.target.value)} className="ml-2 rounded bg-gray-800 p-2"/></label>
   <label className="block"><input required type="checkbox" checked={form.labor_cost_complete} onChange={e=>change('labor_cost_complete',e.target.checked)}/> I reviewed this agreement’s full-term labor and all direct costs, including explicit zero costs; these budgets are complete.</label>
   <label className="block"><input required type="checkbox" checked={form.capacity_complete} onChange={e=>change('capacity_complete',e.target.checked)}/> I reviewed all work and availability for this exact window, including non-Negocio Listo work and commitments outside the app. Other committed hours exclude this deal; its window demand is complete. I checked the exact records above for {today}.</label>
   <label className="block">Budget and capacity sources / correction reason<textarea required maxLength={2000} value={form.source_note} onChange={e=>change('source_note',e.target.value)} className="mt-1 block w-full rounded bg-gray-800 p-2"/></label>
   <p className="text-xs text-gray-400">New agreements, changed prices/plans/project status or recorded hours require another review. Confirmation expires on the next Chicago date. Passing capacity covers this window only. This does not activate decisions or accept a deal.</p>
   {error && <p role="alert" className="text-rose-200">{error}</p>}
   <button disabled={busy || !form.labor_cost_complete || !form.capacity_complete || !form.source_note.trim()} className="rounded border border-indigo-300/40 px-3 py-2">Record complete budget and capacity</button>
  </form>
 </details>
}
