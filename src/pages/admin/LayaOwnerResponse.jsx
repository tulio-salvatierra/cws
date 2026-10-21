import {useState} from 'react'
import {supabase} from '../../lib/supabase'

export default function LayaOwnerResponse({review,label,onReload}) {
 const [choice,setChoice]=useState(null),[reviewToken,setReviewToken]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 if(!review || (!review.can_respond && !review.responses?.length && !review.unavailable_reason))return null
 async function save(event){
  event.preventDefault();setError('');setNotice('')
  if(!reason.trim()){setError('Enter a reason before saving.');return}
  setBusy(true)
  try {
   const {data}=await supabase.auth.getSession()
   const result=await fetch('/api/ceo-today',{method:'POST',headers:{Authorization:`Bearer ${data.session?.access_token || ''}`,'Content-Type':'application/json'},body:JSON.stringify({action:'laya_response',review_token:reviewToken,response:choice,reason})})
   const payload=await result.json()
   if(!result.ok)throw new Error(payload.error || 'Response could not be saved.')
   setChoice(null);setReason('');setNotice('Response saved. No business action was performed.')
   try{await onReload()}catch{setError('Response saved, but history could not reload. Reload CEO Today to see it.')}
  }catch(err){setError(err.message || 'Response could not be saved.')}finally{setBusy(false)}
 }
 return <div className="mt-4 border-t border-sky-300/20 pt-3 text-sm" aria-label={`${label} responses`}>
  <p className="text-xs text-gray-400">Act/Dismiss records your response to this exact evaluation. It does not change goals, budgets, subscriptions or priorities, accept a deal, reserve capacity, change delivery/launch/payment records, or activate a decision.</p>
  {review.can_respond && <div className="mt-3 flex gap-4 text-sky-200">{['act','dismiss'].map(value=><button key={value} disabled={busy} type="button" onClick={()=>{setChoice(value);setReviewToken(review.review_token);setReason('');setError('');setNotice('')}}>{value==='act'?'Act':'Dismiss'}</button>)}</div>}
  {review.unavailable_reason && <p className="mt-2 text-amber-200">{review.unavailable_reason}</p>}
  {review.history_available===false && <p className="mt-2 text-amber-200">Response history is unavailable. Reload to try again.</p>}
  {choice && <form aria-label={`${label} owner response`} className="mt-3 space-y-3 rounded border border-sky-300/20 p-3" onSubmit={save}>
   <p>Record {choice==='act'?'Act':'Dismiss'} for the reviewed evaluation. A reason is required; no advice is carried out.</p>
   <label className="block">Reason<textarea required maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 block w-full rounded bg-gray-800 p-2"/></label>
   <button disabled={busy} className="mr-4 text-sky-200">Save {choice==='act'?'Act':'Dismiss'} response</button>
   <button disabled={busy} type="button" className="text-gray-400" onClick={()=>{setChoice(null);setReason('')}}>Cancel response</button>
  </form>}
  {error && <p role="alert" className="mt-2 text-rose-200">{error}</p>}{notice && <p role="status" className="mt-2 text-sky-200">{notice}</p>}
  {!!review.responses?.length && <details className="mt-3 text-gray-300"><summary>Saved responses ({review.responses.length} among the latest 30 across Laya)</summary>
   {review.responses.map(row=><article key={row.id} className="mt-3 border-t border-gray-700 pt-3"><p>{row.response==='act'?'Act':'Dismiss'} · {row.created_at}</p><p className="mt-1 whitespace-pre-wrap">Reason: {row.reason}</p><p className="mt-1 text-xs">Reviewed {row.evaluation.policy_version} · {row.evaluation.business_date} · {row.evaluation.verdict.replaceAll('_',' ')}</p><details className="mt-2 text-xs"><summary>Exact reviewed input snapshot and evaluation</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify({input_snapshot:row.input_snapshot,evaluation:row.evaluation},null,2)}</pre></details></article>)}
  </details>}
 </div>
}
