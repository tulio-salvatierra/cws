import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { dollarsToCents } from '../../lib/money'

const OBLIGATION_TYPES = [
  ['deposit', 'Deposit'],
  ['milestone', 'Milestone'],
  ['final_payment', 'Final payment'],
  ['recurring', 'Recurring payment'],
  ['other', 'Other'],
]
const PAYMENT_METHODS = [
  ['zelle', 'Zelle'],
  ['square', 'Square'],
  ['check', 'Check'],
  ['cash', 'Cash'],
  ['bank_transfer', 'Bank transfer'],
  ['other', 'Other'],
]
const RECURRING_PROVIDERS = [
  ['square', 'Square'],
  ['manual', 'Manual'],
  ['other', 'Other'],
]

const today = () => new Date().toISOString().slice(0, 10)

export default function AccountingPage() {
  const [accounting, setAccounting] = useState(null)
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showObligation, setShowObligation] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError('Sign in to view Accounting.')
      return
    }
    const response = await fetch('/api/accounting', { headers: { Authorization: `Bearer ${session.access_token}` } })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.ok) {
      setError(payload.error || 'Accounting could not be loaded.')
      return
    }
    setAccounting(payload.accounting)
    setClients(payload.clients || [])
    setProjects(payload.operations_projects || [])
    setError('')
  }, [])

  useEffect(() => { void load() }, [load])

  const ownerAction = async (body) => {
    setBusy(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sign in to make Accounting changes.')
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Accounting could not be updated.')
      await load()
      return payload
    } catch (actionError) {
      setError(actionError.message || 'Accounting could not be updated.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const clientProjects = useMemo(() => projects, [projects])

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-6xl">
    <h1 className="text-4xl font-semibold">Accounting</h1>
    <p className="mt-3 max-w-2xl text-slate-300">Track money expected, owner-confirmed receipts, and recurring revenue. This does not send invoices, charge customers, or reconcile payment providers.</p>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-rose-100">{error}</p>}

    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Financial summary">
      <Summary label="Expected" cents={accounting?.summary?.expected_amount_cents} />
      <Summary label="Received" cents={accounting?.summary?.received_amount_cents} />
      <Summary label="Outstanding" cents={accounting?.summary?.outstanding_amount_cents} />
      <Summary label="Overdue" cents={accounting?.summary?.overdue_amount_cents} tone="rose" />
      <Summary label="MRR" cents={accounting?.summary?.monthly_recurring_revenue_cents} />
    </section>

    <section className="mt-8 flex flex-wrap gap-3" aria-label="Accounting actions">
      <button type="button" onClick={() => setShowObligation((open) => !open)} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950">Add expected payment</button>
      <button type="button" onClick={() => setShowReceipt((open) => !open)} className="rounded-xl border border-white/20 px-4 py-3 font-semibold">Record payment received</button>
      <button type="button" onClick={() => setShowRecurring((open) => !open)} className="rounded-xl border border-white/20 px-4 py-3 font-semibold">Add recurring revenue</button>
    </section>

    {showObligation && <ObligationForm clients={clients} projects={clientProjects} busy={busy} onSubmit={async (body) => { if (await ownerAction(body)) setShowObligation(false) }} />}
    {showReceipt && <ReceiptForm obligations={accounting?.outstanding_obligations || []} busy={busy} onSubmit={async (body) => { if (await ownerAction(body)) setShowReceipt(false) }} />}
    {showRecurring && <RecurringForm clients={clients} busy={busy} onSubmit={async (body) => { if (await ownerAction(body)) setShowRecurring(false) }} />}
    {editingRecurring && <RecurringEditForm key={editingRecurring.id} item={editingRecurring} busy={busy} onSubmit={async (body) => { if (await ownerAction(body)) setEditingRecurring(null) }} />}

    <section className="mt-10"><SectionTitle title="Outstanding money" description="Expected payments not yet fully covered by recorded receipts." />
      <div className="mt-4 space-y-3">{accounting?.outstanding_obligations?.length
        ? accounting.outstanding_obligations.map((item) => <ObligationRow key={item.id} item={item} busy={busy} onAction={ownerAction} />)
        : <Empty message="No outstanding expected payments." />}</div>
    </section>

    <section className="mt-10"><SectionTitle title="Recent payments" description="Owner-confirmed payment receipts are preserved as history." />
      <div className="mt-4 space-y-3">{accounting?.recent_receipts?.length
        ? accounting.recent_receipts.map((receipt) => <article key={receipt.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{receipt.client_name}</h3><p className="mt-1 text-sm text-slate-300">{receipt.obligation_description} · {label(receipt.payment_method)}</p>{receipt.reference_note && <p className="mt-2 text-sm text-slate-400">{receipt.reference_note}</p>}</div><div className="text-right"><p className="text-lg font-semibold text-emerald-200">{money(receipt.amount_cents)}</p><p className="mt-1 text-xs text-slate-400">{formatDate(receipt.received_at)}</p></div></div></article>)
        : <Empty message="No payment receipts recorded yet." />}</div>
    </section>

    <section className="mt-10"><SectionTitle title="Recurring revenue" description="Expected recurring revenue only; Square or another provider remains responsible for charging customers." />
      <div className="mt-4 space-y-3">{accounting?.recurring_revenue?.length
        ? accounting.recurring_revenue.map((item) => <RecurringRow key={item.id} item={item} busy={busy} onAction={ownerAction} onEdit={() => setEditingRecurring(item)} />)
        : <Empty message="No recurring revenue recorded yet." />}</div>
    </section>
  </div></main>
}

function ObligationForm({ clients, projects, busy, onSubmit }) {
  const [values, setValues] = useState({ client_id: clients[0]?.id || '', operations_project_id: '', description: '', amount: '', obligation_type: 'deposit', due_date: '' })
  const availableProjects = projects.filter((project) => project.client_id === values.client_id)
  return <FormPanel title="Add expected payment"><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => {
    event.preventDefault(); const amount_cents = dollarsToCents(values.amount); if (!amount_cents) return; void onSubmit({ action: 'create_financial_obligation', ...values, amount_cents })
  }}>
    <Select required label="Client" value={values.client_id} options={[['', 'Select a client'], ...clients.map((client) => [client.id, client.name])]} onChange={(client_id) => setValues({ ...values, client_id, operations_project_id: '' })} />
    <Select label="Operations project (optional)" value={values.operations_project_id} options={[['', 'No Operations project'], ...availableProjects.map((project) => [project.id, project.name])]} onChange={(operations_project_id) => setValues({ ...values, operations_project_id })} />
    <Input required label="Description" value={values.description} onChange={(description) => setValues({ ...values, description })} placeholder="Website project deposit" />
    <Input required label="Amount (USD)" value={values.amount} onChange={(amount) => setValues({ ...values, amount })} inputMode="decimal" placeholder="750.00" />
    <Select label="Payment type" value={values.obligation_type} options={OBLIGATION_TYPES} onChange={(obligation_type) => setValues({ ...values, obligation_type })} />
    <Input label="Due date (optional)" type="date" value={values.due_date} onChange={(due_date) => setValues({ ...values, due_date })} />
    <button disabled={busy || !clients.length} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Save expected payment</button>
  </form></FormPanel>
}

function ReceiptForm({ obligations, busy, onSubmit }) {
  const [values, setValues] = useState({ financial_obligation_id: obligations[0]?.id || '', amount: '', received_at: today(), payment_method: 'zelle', reference_note: '' })
  return <FormPanel title="Record payment received"><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => {
    event.preventDefault(); const amount_cents = dollarsToCents(values.amount); if (!amount_cents) return; void onSubmit({ action: 'record_payment_receipt', ...values, amount_cents })
  }}>
    <Select required label="Expected payment" value={values.financial_obligation_id} options={[['', 'Select an expected payment'], ...obligations.map((item) => [item.id, `${item.client?.name || 'Client'} — ${item.description} (${money(item.outstanding_amount_cents)} outstanding)`])]} onChange={(financial_obligation_id) => setValues({ ...values, financial_obligation_id })} />
    <Input required label="Amount received (USD)" value={values.amount} onChange={(amount) => setValues({ ...values, amount })} inputMode="decimal" placeholder="750.00" />
    <Input required label="Received date" type="date" value={values.received_at} onChange={(received_at) => setValues({ ...values, received_at })} />
    <Select label="Payment method" value={values.payment_method} options={PAYMENT_METHODS} onChange={(payment_method) => setValues({ ...values, payment_method })} />
    <Input label="Reference note (optional)" value={values.reference_note} onChange={(reference_note) => setValues({ ...values, reference_note })} placeholder="Owner-confirmed Zelle payment" />
    <button disabled={busy || !obligations.length} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Record receipt</button>
  </form></FormPanel>
}

function RecurringForm({ clients, busy, onSubmit }) {
  const [values, setValues] = useState({ client_id: clients[0]?.id || '', description: '', amount: '', provider: 'square', provider_reference: '', started_at: today(), next_expected_at: '' })
  return <FormPanel title="Add recurring revenue"><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => {
    event.preventDefault(); const amount_cents = dollarsToCents(values.amount); if (!amount_cents) return; void onSubmit({ action: 'create_recurring_revenue', ...values, amount_cents })
  }}>
    <Select required label="Client" value={values.client_id} options={[['', 'Select a client'], ...clients.map((client) => [client.id, client.name])]} onChange={(client_id) => setValues({ ...values, client_id })} />
    <Input required label="Description" value={values.description} onChange={(description) => setValues({ ...values, description })} placeholder="Monthly website care" />
    <Input required label="Monthly amount (USD)" value={values.amount} onChange={(amount) => setValues({ ...values, amount })} inputMode="decimal" placeholder="70.00" />
    <Select label="Provider" value={values.provider} options={RECURRING_PROVIDERS} onChange={(provider) => setValues({ ...values, provider })} />
    <Input required label="Start date" type="date" value={values.started_at} onChange={(started_at) => setValues({ ...values, started_at })} />
    <Input label="Next expected date (optional)" type="date" value={values.next_expected_at} onChange={(next_expected_at) => setValues({ ...values, next_expected_at })} />
    <Input label="Provider reference (optional)" value={values.provider_reference} onChange={(provider_reference) => setValues({ ...values, provider_reference })} placeholder="Square subscription reference" />
    <button disabled={busy || !clients.length} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Save recurring revenue</button>
  </form></FormPanel>
}

function RecurringEditForm({ item, busy, onSubmit }) {
  const [values, setValues] = useState({
    description: item.description || '',
    amount: String(Number(item.amount_cents || 0) / 100),
    provider: item.provider || 'manual',
    provider_reference: item.provider_reference || '',
    started_at: item.started_at || '',
    next_expected_at: item.next_expected_at || '',
  })
  return <FormPanel title="Edit recurring revenue"><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => {
    event.preventDefault(); const amount_cents = dollarsToCents(values.amount); if (!amount_cents) return; void onSubmit({ action: 'update_recurring_revenue', recurring_revenue_id: item.id, ...values, amount_cents })
  }}>
    <Input required label="Description" value={values.description} onChange={(description) => setValues({ ...values, description })} />
    <Input required label="Monthly amount (USD)" value={values.amount} onChange={(amount) => setValues({ ...values, amount })} inputMode="decimal" />
    <Select label="Provider" value={values.provider} options={RECURRING_PROVIDERS} onChange={(provider) => setValues({ ...values, provider })} />
    <Input required label="Start date" type="date" value={values.started_at} onChange={(started_at) => setValues({ ...values, started_at })} />
    <Input label="Next expected date (optional)" type="date" value={values.next_expected_at} onChange={(next_expected_at) => setValues({ ...values, next_expected_at })} />
    <Input label="Provider reference (optional)" value={values.provider_reference} onChange={(provider_reference) => setValues({ ...values, provider_reference })} />
    <button disabled={busy} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Save recurring revenue</button>
  </form></FormPanel>
}

function ObligationRow({ item, busy, onAction }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">{label(item.financial_state)}</p><h3 className="mt-1 text-lg font-semibold">{item.client?.name || 'Client unavailable'}</h3><p className="mt-1 text-sm text-slate-300">{item.description}{item.project?.name ? ` · ${item.project.name}` : ''}</p>{item.due_date && <p className="mt-2 text-sm text-slate-400">Due {item.due_date}</p>}</div><div className="text-right"><p className="text-xl font-semibold">{money(item.outstanding_amount_cents)}</p><p className="mt-1 text-sm text-slate-400">of {money(item.amount_cents)} outstanding</p></div></div>
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => onAction({ action: 'resolve_financial_obligation', financial_obligation_id: item.id, status: 'waived' })} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Waive</button><button type="button" disabled={busy} onClick={() => onAction({ action: 'resolve_financial_obligation', financial_obligation_id: item.id, status: 'cancelled' })} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Cancel</button></div>
  </article>
}

function RecurringRow({ item, busy, onAction, onEdit }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">{label(item.status)} · {label(item.provider)}</p><h3 className="mt-1 text-lg font-semibold">{item.client?.name || 'Client unavailable'}</h3><p className="mt-1 text-sm text-slate-300">{item.description}</p>{item.next_expected_at && <p className="mt-2 text-sm text-slate-400">Next expected {item.next_expected_at}</p>}</div><p className="text-xl font-semibold">{money(item.amount_cents)}<span className="text-sm font-normal text-slate-400"> / month</span></p></div>
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={onEdit} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Edit details</button>{item.status === 'active' && <><button type="button" disabled={busy} onClick={() => onAction({ action: 'set_recurring_revenue_status', recurring_revenue_id: item.id, status: 'paused' })} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Pause</button><button type="button" disabled={busy} onClick={() => onAction({ action: 'set_recurring_revenue_status', recurring_revenue_id: item.id, status: 'ended', ended_at: today() })} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">End</button></>}</div>
  </article>
}

function Summary({ label: summaryLabel, cents, tone = 'slate' }) { return <article className={`rounded-2xl border p-4 ${tone === 'rose' ? 'border-rose-300/20 bg-rose-300/[0.06]' : 'border-white/10 bg-white/[0.04]'}`}><p className="text-sm text-slate-400">{summaryLabel}</p><p className="mt-2 text-2xl font-semibold">{money(cents || 0)}</p></article> }
function SectionTitle({ title, description }) { return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p></div> }
function Empty({ message }) { return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">{message}</p> }
function FormPanel({ title, children }) { return <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-xl font-semibold">{title}</h2>{children}</section> }
function Input({ label: inputLabel, value, onChange, ...props }) { return <label className="text-sm text-slate-300">{inputLabel}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white" {...props} /></label> }
function Select({ label: selectLabel, value, onChange, options, required = false }) { return <label className="text-sm text-slate-300">{selectLabel}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white">{options.map(([option, optionLabel]) => <option key={option} value={option}>{optionLabel}</option>)}</select></label> }

function money(cents) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100) }
function label(value) { return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatDate(value) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) }
