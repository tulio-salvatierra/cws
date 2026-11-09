import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { NEGOCIO_LISTO } from '../../data/negocioListo'

// DEC-040: $300 setup at signing; the monthly plan starts 14 days after the setup
// payment; 12 months. Records everything in Accounting and, if checked, creates
// the Square subscription (Square emails each monthly invoice).
const PLANS = NEGOCIO_LISTO.en.plans.items
const METHODS = [['zelle', 'Zelle'], ['square', 'Square'], ['cash', 'Cash'], ['check', 'Check'], ['bank_transfer', 'Bank transfer'], ['other', 'Other']]
const field = 'mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white'

function todayChicago() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function plusDays(day, days) {
  const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10)
}
function pretty(day) {
  return day ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`)) : ''
}

export default function SignNegocioListoForm({ lead = null, onDone, onCancel, onClose }) {
  const [ids] = useState(() => ({ signing: crypto.randomUUID(), receipt: crypto.randomUUID() }))
  const [values, setValues] = useState({ client_name: lead?.business || '', client_email: lead?.email || '', client_phone: lead?.phone || '', plan: 'basico', setup_paid_on: todayChicago(), setup_method: 'zelle', create_square_subscription: Boolean(lead?.email) })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const plan = PLANS.find((item) => item.id === values.plan)
  const starts = useMemo(() => (values.setup_paid_on ? plusDays(values.setup_paid_on, 14) : ''), [values.setup_paid_on])
  const set = (key) => (event) => setValues((old) => ({ ...old, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign_negocio_listo', signing_id: ids.signing, receipt_id: ids.receipt, lead_id: lead?.id || undefined, ...values }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'The signing could not be recorded.')
      setResult(body)
      await onDone?.(body)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  if (result) return <div role="status" className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-100">
    <p className="font-semibold">{values.client_name || 'Client'} is signed: Negocio Listo {plan?.name}.</p>
    <p className="mt-1">Setup $300 recorded ({pretty(result.setup_paid_on)}). 12 monthly payments of ${result.monthly_cents / 100} start {pretty(result.billing_start_date)}, now in Accounting.</p>
    {result.square?.requested && (result.square.ok
      ? <p className="mt-1">Square subscription created. Square will email the first invoice on {pretty(result.square.start_date)}.</p>
      : <p className="mt-1 text-amber-200">Square subscription not created: {result.square.error} Accounting is saved; set it up in Square or try again later.</p>)}
    {onClose && <button type="button" onClick={onClose} className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200">Done</button>}
  </div>

  return <form aria-label="Record Negocio Listo signing" onSubmit={submit} className="mt-3 grid gap-3 border-t border-white/10 pt-3 md:grid-cols-3">
    <label className="text-xs text-slate-400">Business name<input required maxLength={200} value={values.client_name} onChange={set('client_name')} className={field} /></label>
    <label className="text-xs text-slate-400">Client email<input type="email" value={values.client_email} onChange={set('client_email')} className={field} /></label>
    <label className="text-xs text-slate-400">Client phone<input value={values.client_phone} onChange={set('client_phone')} className={field} /></label>
    <label className="text-xs text-slate-400">Plan<select value={values.plan} onChange={set('plan')} className={field}>{PLANS.map((item) => <option key={item.id} value={item.id}>{item.name} — ${item.price}/mo</option>)}</select></label>
    <label className="text-xs text-slate-400">$300 setup paid on<input required type="date" max={todayChicago()} value={values.setup_paid_on} onChange={set('setup_paid_on')} className={field} /></label>
    <label className="text-xs text-slate-400">Paid with<select value={values.setup_method} onChange={set('setup_method')} className={field}>{METHODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="flex items-start gap-2 text-sm text-slate-200 md:col-span-3"><input type="checkbox" checked={values.create_square_subscription} onChange={set('create_square_subscription')} className="mt-1" /><span>Create the Square subscription. Square emails a ${plan?.price} invoice every month starting {pretty(starts)}.</span></label>
    <p className="text-sm text-slate-300 md:col-span-3">Plan starts <strong>{pretty(starts)}</strong> (14 days after setup). 12 payments of ${plan?.price}, the same day each month. Launch date doesn&apos;t change billing.</p>
    {error && <p role="alert" className="text-sm text-rose-200 md:col-span-3">{error}</p>}
    <div className="flex gap-3 md:col-span-3">
      <button disabled={busy} className="rounded-xl bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? 'Recording…' : 'Record signing'}</button>
      <button type="button" onClick={onCancel} className="text-sm text-slate-400 hover:text-white">Cancel</button>
    </div>
  </form>
}
