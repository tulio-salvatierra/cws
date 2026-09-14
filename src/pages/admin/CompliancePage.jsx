import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  ['business_registration', 'Business registration'], ['license', 'License'], ['tax', 'Tax'], ['filing', 'Filing'],
  ['insurance', 'Insurance'], ['employment', 'Employment'], ['privacy', 'Privacy'], ['other', 'Other'],
]
const RECURRENCES = [
  ['none', 'None / no scheduled recurrence'], ['one_time', 'One time'], ['annual', 'Annual'], ['quarterly', 'Quarterly'], ['monthly', 'Monthly'], ['custom', 'Custom interval'],
]

const today = () => new Date().toISOString().slice(0, 10)

export default function CompliancePage() {
  const [compliance, setCompliance] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [settingDue, setSettingDue] = useState(null)
  const [recording, setRecording] = useState(null)

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return setError('Sign in to view Compliance.')
    const response = await fetch('/api/compliance', { headers: { Authorization: `Bearer ${session.access_token}` } })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.ok) return setError(payload.error || 'Compliance could not be loaded.')
    setCompliance(payload.compliance)
    setError('')
  }, [])

  useEffect(() => { void load() }, [load])

  const ownerAction = async (body) => {
    setBusy(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sign in to make Compliance changes.')
      const response = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Compliance could not be updated.')
      await load()
      return payload
    } catch (actionError) {
      setError(actionError.message || 'Compliance could not be updated.')
      return null
    } finally {
      setBusy(false)
    }
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-6xl">
    <h1 className="text-4xl font-semibold">Compliance</h1>
    <p className="mt-3 max-w-3xl text-slate-300">Keep owner-verified CWS obligations, their authority, due dates, and completion history. This does not give legal advice, research rules, or file anything.</p>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-rose-100">{error}</p>}

    <section className="mt-8" aria-label="Compliance summary">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Summary label="Verified" value={compliance?.summary?.verified_requirements} />
        <Summary label="Needs verification" value={compliance?.summary?.needs_verification} tone="amber" />
        <Summary label="Approaching" value={compliance?.summary?.approaching} />
        <Summary label="Due" value={compliance?.summary?.due} tone="amber" />
        <Summary label="Overdue" value={compliance?.summary?.overdue} tone="rose" />
      </div>
      <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200" role="status">{compliance?.summary?.attention_message || 'Loading Compliance state…'}</p>
    </section>

    <section className="mt-8 flex flex-wrap gap-3" aria-label="Compliance actions">
      <button type="button" onClick={() => setShowCreate((open) => !open)} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950">Add possible requirement</button>
    </section>
    {showCreate && <RequirementForm title="Add possible requirement" busy={busy} onSubmit={async (body) => { if (await ownerAction({ action: 'create_possible_compliance_requirement', ...body })) setShowCreate(false) }} />}
    {editing && <RequirementForm key={editing.id} title="Edit source and details" requirement={editing} busy={busy} onSubmit={async (body) => { if (await ownerAction({ action: 'update_compliance_requirement_details', compliance_requirement_id: editing.id, ...body })) setEditing(null) }} />}
    {settingDue && <DueDateForm key={settingDue.id} requirement={settingDue} busy={busy} onSubmit={async (body) => { if (await ownerAction({ action: 'set_compliance_due_date', compliance_requirement_id: settingDue.id, ...body })) setSettingDue(null) }} />}
    {recording && <CompletionForm key={recording.id} requirement={recording} busy={busy} onSubmit={async (body) => { if (await ownerAction({ action: 'record_compliance_completion', compliance_requirement_id: recording.id, ...body })) setRecording(null) }} />}

    <section className="mt-10"><SectionTitle title="Requirements" description="Possible obligations stay unverified until an owner confirms applicability. Due states only come from owner-verified requirements." />
      <div className="mt-4 space-y-4">{compliance?.requirements?.length
        ? compliance.requirements.map((item) => <RequirementRow key={item.id} item={item} busy={busy} onAction={ownerAction} onEdit={() => setEditing(item)} onSetDue={() => setSettingDue(item)} onComplete={() => setRecording(item)} />)
        : <Empty message="No Compliance requirements recorded yet. Add a possible requirement only when you are ready to review it with an authority source." />}</div>
    </section>

    <section className="mt-10"><SectionTitle title="Completion history" description="Owner-recorded completions are preserved as Compliance history." />
      <div className="mt-4 space-y-3">{compliance?.recent_completions?.length
        ? compliance.recent_completions.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><h3 className="font-semibold">{item.requirement_title}</h3><p className="mt-1 text-sm text-slate-300">Completed {item.completed_at}</p>{item.notes && <p className="mt-2 text-sm text-slate-400">{item.notes}</p>}</article>)
        : <Empty message="No Compliance completions recorded yet." />}</div>
    </section>
  </div></main>
}

function RequirementRow({ item, busy, onAction, onEdit, onSetDue, onComplete }) {
  const isUnverified = item.compliance_state === 'unverified'
  const canSchedule = item.applicability_status === 'applies' && item.verified_by_owner_at
  return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-wrap justify-between gap-4"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">{label(item.compliance_state)}</p><h3 className="mt-1 text-xl font-semibold">{item.title}</h3><p className="mt-2 text-sm text-slate-300">{item.description}</p><dl className="mt-4 grid gap-x-6 gap-y-2 text-sm text-slate-400 sm:grid-cols-2"><Info label="Authority" value={item.authority_name} /><Info label="Jurisdiction" value={item.jurisdiction || 'Not recorded'} /><Info label="Applicability" value={label(item.applicability_status)} /><Info label="Next due" value={item.next_due_date || 'Not recorded'} /></dl>{item.source_url && <a className="mt-4 inline-block text-sm font-semibold text-orange-200 underline" href={item.source_url} target="_blank" rel="noreferrer">Open authority source</a>}</div><p className="max-w-xs text-sm text-slate-300">{item.human_reason}</p></div>
    <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={onEdit} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Edit source/details</button>{isUnverified && <><button type="button" disabled={busy} onClick={() => onAction({ action: 'verify_compliance_requirement_applies', compliance_requirement_id: item.id })} className="rounded-full bg-orange-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">Verify applies</button><button type="button" disabled={busy} onClick={() => onAction({ action: 'mark_compliance_requirement_not_applicable', compliance_requirement_id: item.id })} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Mark not applicable</button></>}{canSchedule && <><button type="button" disabled={busy} onClick={onSetDue} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Set / confirm due date</button><button type="button" disabled={busy} onClick={onComplete} className="rounded-full border border-white/20 px-3 py-2 text-sm disabled:opacity-50">Record completion</button></>}</div>
  </article>
}

function RequirementForm({ title, requirement, busy, onSubmit }) {
  const [values, setValues] = useState({
    title: requirement?.title || '', category: requirement?.category || 'filing', authority_name: requirement?.authority_name || '', source_url: requirement?.source_url || '', jurisdiction: requirement?.jurisdiction || '', description: requirement?.description || '', recurrence_type: requirement?.recurrence_type || 'none', recurrence_interval: requirement?.recurrence_interval || '', next_due_date: requirement?.next_due_date || '', notes: requirement?.notes || '',
  })
  return <FormPanel title={title}><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void onSubmit(values) }}><Input required label="Title" value={values.title} onChange={(title) => setValues({ ...values, title })} placeholder="Illinois annual report" /><Select label="Category" value={values.category} options={CATEGORIES} onChange={(category) => setValues({ ...values, category })} /><Input required label="Authority" value={values.authority_name} onChange={(authority_name) => setValues({ ...values, authority_name })} placeholder="Illinois Secretary of State" /><Input label="Source URL (optional)" type="url" value={values.source_url} onChange={(source_url) => setValues({ ...values, source_url })} placeholder="https://…" /><Input label="Jurisdiction (optional)" value={values.jurisdiction} onChange={(jurisdiction) => setValues({ ...values, jurisdiction })} placeholder="Illinois" /><Select label="Recurrence" value={values.recurrence_type} options={RECURRENCES} onChange={(recurrence_type) => setValues({ ...values, recurrence_type, recurrence_interval: recurrence_type === 'custom' ? values.recurrence_interval : '' })} />{values.recurrence_type === 'custom' && <Input required label="Custom interval (months)" type="number" min="1" max="120" value={values.recurrence_interval} onChange={(recurrence_interval) => setValues({ ...values, recurrence_interval })} />}<Input label="Known next due date (optional)" type="date" value={values.next_due_date} onChange={(next_due_date) => setValues({ ...values, next_due_date })} /><TextArea required label="Description" value={values.description} onChange={(description) => setValues({ ...values, description })} placeholder="What this possible obligation covers." /><TextArea label="Notes (optional)" value={values.notes} onChange={(notes) => setValues({ ...values, notes })} placeholder="Owner context only." /><button disabled={busy} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Save requirement</button></form></FormPanel>
}

function DueDateForm({ requirement, busy, onSubmit }) {
  const [nextDueDate, setNextDueDate] = useState(requirement.next_due_date || '')
  return <FormPanel title={`Set due date — ${requirement.title}`}><form className="mt-4 flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); void onSubmit({ next_due_date: nextDueDate }) }}><Input required label="Next due date" type="date" value={nextDueDate} onChange={setNextDueDate} /><button disabled={busy} className="self-end rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Confirm due date</button></form></FormPanel>
}

function CompletionForm({ requirement, busy, onSubmit }) {
  const [values, setValues] = useState({ completed_at: today(), next_due_date: '', notes: '' })
  const recurring = ['annual', 'quarterly', 'monthly', 'custom'].includes(requirement.recurrence_type)
  return <FormPanel title={`Record completion — ${requirement.title}`}><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void onSubmit(values) }}><Input required label="Completed date" type="date" max={today()} value={values.completed_at} onChange={(completed_at) => setValues({ ...values, completed_at })} /><Input required={recurring} label={recurring ? 'Confirm next due date' : 'Next due date (optional)'} type="date" value={values.next_due_date} onChange={(next_due_date) => setValues({ ...values, next_due_date })} /><TextArea label="Completion notes (optional)" value={values.notes} onChange={(notes) => setValues({ ...values, notes })} /><button disabled={busy} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Record completion</button></form></FormPanel>
}

function Summary({ label: summaryLabel, value, tone = 'slate' }) { return <article className={`rounded-2xl border p-4 ${tone === 'rose' ? 'border-rose-300/20 bg-rose-300/[0.06]' : tone === 'amber' ? 'border-amber-300/20 bg-amber-300/[0.06]' : 'border-white/10 bg-white/[0.04]'}`}><p className="text-sm text-slate-400">{summaryLabel}</p><p className="mt-2 text-2xl font-semibold">{value ?? 0}</p></article> }
function SectionTitle({ title, description }) { return <div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p></div> }
function Empty({ message }) { return <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">{message}</p> }
function FormPanel({ title, children }) { return <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-xl font-semibold">{title}</h2>{children}</section> }
function Input({ label: inputLabel, value, onChange, ...props }) { return <label className="text-sm text-slate-300">{inputLabel}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white" {...props} /></label> }
function Select({ label: selectLabel, value, onChange, options }) { return <label className="text-sm text-slate-300">{selectLabel}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white">{options.map(([option, optionLabel]) => <option key={option} value={option}>{optionLabel}</option>)}</select></label> }
function TextArea({ label: textAreaLabel, value, onChange, ...props }) { return <label className="text-sm text-slate-300 md:col-span-2">{textAreaLabel}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows="3" className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white" {...props} /></label> }
function Info({ label: infoLabel, value }) { return <div><dt className="text-xs uppercase tracking-wide text-slate-500">{infoLabel}</dt><dd>{value}</dd></div> }
function label(value) { return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
