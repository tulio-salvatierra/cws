import LayaFeedbackFields from './LayaFeedbackFields'
import LayaSavedFeedback from './LayaSavedFeedback'
import { optionalFeedbackPayload } from '../../../shared/laya-feedback'
import {useState} from 'react'
import {supabase} from '../../lib/supabase'

export default function LayaOwnerResponse({review,label,onReload}) {
 const [category,setCategory]=useState(''),[alternative,setAlternative]=useState('')
 const [choice,setChoice]=useState(null),[reviewToken,setReviewToken]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 if(!review || (!review.can_respond && !review.responses?.length && !review.unavailable_reason))return null
 async function save(event){
  event.preventDefault();setError('');setNotice('')
  if(!reason.trim()){setError('Enter a reason before saving.');return}
  setBusy(true)
  try {
   const {data}=await supabase.auth.getSession()
   const result=await fetch('/api/ceo-today',{method:'POST',headers:{Authorization:`Bearer ${data.session?.access_token || ''}`,'Content-Type':'application/json'},body:JSON.stringify({action:'laya_response',review_token:reviewToken,response:choice,reason,...optionalFeedbackPayload(category,alternative)})})
   const payload=await result.json()
   if(!result.ok)throw new Error(payload.error || 'Response could not be saved.')
   setChoice(null);setReason('');setCategory('');setAlternative('');setNotice('Response saved. No business action was performed.')
   try{await onReload()}catch{setError('Response saved, but history could not reload. Reload CEO Today to see it.')}
  }catch(err){setError(err.message || 'Response could not be saved.')}finally{setBusy(false)}
 }
 return <div className="[&_p]:mb-0 mt-4 border-t border-sky-300/20 pt-3 text-sm" aria-label={`${label} responses`}>
  <p className="font-medium text-gray-200">Your response</p>
  <p className="mt-1 max-w-prose text-sm leading-6 text-gray-400">Act or Dismiss saves your choice and reason. You carry out the next step separately.</p>
  <details className="mt-2 text-xs leading-5 text-gray-400"><summary className="cursor-pointer py-1 text-sky-200">What happens when I respond?</summary><p className="mt-2 max-w-prose">Act/Dismiss records your response to this exact evaluation. It does not change goals, budgets, subscriptions or priorities, accept a deal, reserve capacity, change delivery/launch/payment records, or activate a decision.</p></details>
  {review.can_respond && <div className="mt-3 flex flex-wrap gap-3 text-sky-200">{['act','dismiss'].map(value=><button key={value} className="rounded-lg border border-sky-300/30 px-4 py-2.5 font-medium transition hover:bg-sky-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:opacity-50" disabled={busy} type="button" onClick={()=>{setChoice(value);setReviewToken(review.review_token);setReason('');setCategory('');setAlternative('');setError('');setNotice('')}}>{value==='act'?'Act':'Dismiss'}</button>)}</div>}
  {review.unavailable_reason && <p className="mt-2 text-amber-200">{review.unavailable_reason}</p>}
  {review.history_available===false && <p className="mt-2 text-amber-200">Response history is unavailable. Reload to try again.</p>}
  {choice && <form aria-label={`${label} owner response`} className="mt-3 space-y-3 rounded border border-sky-300/20 p-3" onSubmit={save}>
   <p>Record {choice==='act'?'Act':'Dismiss'} for the reviewed evaluation. A reason is required; no advice is carried out.</p>
   <label className="block">Reason<textarea required maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 block w-full rounded bg-gray-800 p-2"/></label>
   <LayaFeedbackFields category={category} alternative={alternative} onCategoryChange={setCategory} onAlternativeChange={setAlternative} disabled={busy} />
   <button disabled={busy} className="mr-4 text-sky-200">Save {choice==='act'?'Act':'Dismiss'} response</button>
   <button disabled={busy} type="button" className="text-gray-400" onClick={()=>{setChoice(null);setReason('')}}>Cancel response</button>
  </form>}
  {error && <p role="alert" className="mt-2 text-rose-200">{error}</p>}{notice && <p role="status" className="mt-2 text-sky-200">{notice}</p>}
  {!!review.responses?.length && <details className="mt-3 text-gray-300"><summary>Saved responses ({review.responses.length} among the latest 30 across Laya)</summary>
   {review.responses.map(row=><article key={row.id} className="mt-3 border-t border-gray-700 pt-3"><p>{row.response==='act'?'Act':'Dismiss'} · {row.created_at}</p><p className="mt-1 whitespace-pre-wrap">Reason: {row.reason}</p><LayaSavedFeedback response={row} /><p className="mt-1 text-xs">Reviewed {row.evaluation.policy_version} · {row.evaluation.business_date} · {row.evaluation.verdict.replaceAll('_',' ')}</p><details className="mt-2 text-xs"><summary>Exact reviewed input snapshot and evaluation</summary><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify({input_snapshot:row.input_snapshot,evaluation:row.evaluation},null,2)}</pre></details></article>)}
  </details>}
 </div>
}
