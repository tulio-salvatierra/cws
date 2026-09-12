import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const PROJECT_TYPES = [
  ['website_build', 'Website build'],
  ['website_refresh', 'Website refresh'],
  ['photography_video', 'Photography / video'],
  ['marketing_support', 'Marketing support'],
  ['other', 'Other'],
]
const PROJECT_STATUSES = [
  ['setup', 'Setup'],
  ['in_progress', 'In progress'],
  ['waiting_on_client', 'Waiting on client'],
  ['waiting_on_cws', 'Waiting on CWS'],
  ['completed', 'Completed'],
  ['paused', 'Paused'],
]
const REQUIREMENT_STATUSES = [
  ['needed', 'Needed'],
  ['received', 'Received'],
  ['not_applicable', 'Not applicable'],
]
const REQUIREMENT_TIMINGS = [
  ['needed_now', 'Needed now'],
  ['needed_later', 'Needed later'],
  ['opportunity', 'Opportunity'],
]
const RESPONSIBLE_PARTIES = [
  ['client', 'Client'],
  ['cws', 'CWS'],
]

export default function OperationsPage({ projectId = null }) {
  const navigate = useNavigate()
  const [operations, setOperations] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ client_name: '', contact_email: '', contact_phone: '', project_name: '', project_type: 'website_build' })

  const load = useCallback(async () => {
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError('Sign in to view Operations.')
      return
    }
    const query = projectId ? `?project_id=${encodeURIComponent(projectId)}` : ''
    const response = await fetch(`/api/operations${query}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.ok) {
      setError(payload.error || 'Operations could not be loaded.')
      return
    }
    setOperations(payload.operations)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const ownerAction = async (body) => {
    setBusy(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sign in to make Operations changes.')
      const response = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Operations could not be updated.')
      await load()
      return payload
    } catch (actionError) {
      setError(actionError.message || 'Operations could not be updated.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const project = useMemo(() => projectId ? operations?.projects?.[0] || null : null, [operations, projectId])

  if (projectId) return <ProjectDetail project={project} loading={!operations} error={error} busy={busy} onAction={ownerAction} />

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-6xl">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">Operations V1</p>
    <h1 className="mt-3 text-4xl font-semibold">Client readiness</h1>
    <p className="mt-3 max-w-2xl text-slate-300">Track the information needed to deliver client work. This is a fixed readiness checklist, not a task manager.</p>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-rose-100">{error}</p>}

    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-xl font-semibold">Start a client project</h2><p className="mt-1 text-sm text-slate-400">Creates or reuses the client and seeds the fixed Operations checklist. Nothing is sent externally.</p>
      <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const created = await ownerAction({ action: 'create_operations_project', ...form }); if (created?.project?.id) { setForm({ client_name: '', contact_email: '', contact_phone: '', project_name: '', project_type: 'website_build' }); navigate(`/admin/operations/${created.project.id}`) } }}>
        <input required value={form.client_name} onChange={(event) => setForm({ ...form, client_name: event.target.value })} placeholder="Client or business name" className="rounded-xl bg-slate-900 p-3" />
        <input value={form.project_name} required onChange={(event) => setForm({ ...form, project_name: event.target.value })} placeholder="Project name" className="rounded-xl bg-slate-900 p-3" />
        <input value={form.contact_email} type="email" onChange={(event) => setForm({ ...form, contact_email: event.target.value })} placeholder="Client email (optional)" className="rounded-xl bg-slate-900 p-3" />
        <input value={form.contact_phone} onChange={(event) => setForm({ ...form, contact_phone: event.target.value })} placeholder="Client phone (optional)" className="rounded-xl bg-slate-900 p-3" />
        <select value={form.project_type} onChange={(event) => setForm({ ...form, project_type: event.target.value })} className="rounded-xl bg-slate-900 p-3">{PROJECT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button disabled={busy} className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? 'Saving…' : 'Create Operations project'}</button>
      </form>
    </section>

    <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold">Active projects</h2><p className="mt-1 text-sm text-slate-400">Derived from durable Operations readiness state.</p></div>{operations && <p className="text-sm text-slate-400">{operations.projects.length} project{operations.projects.length === 1 ? '' : 's'}</p>}</div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{operations?.projects?.length ? operations.projects.map((item) => <ProjectCard key={item.id} project={item} />) : <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">No Operations projects yet.</p>}</div>
    </section>
  </div></main>
}

function ProjectCard({ project }) {
  return <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">{project.client?.name || 'Client unavailable'}</p><h2 className="mt-2 text-xl font-semibold">{project.name}</h2><p className="mt-1 text-sm text-slate-400">{projectTypeLabel(project.project_type)} · {stateLabel(project.delivery_state)}</p></div><Readiness readiness={project.readiness} /></div>
    <p className="mt-4 text-sm text-slate-200">{project.human_reason}</p>
    <p className="mt-2 text-sm text-slate-400">{project.blocker_count} needed-now blocker{project.blocker_count === 1 ? '' : 's'}</p>
    <Link className="mt-5 inline-flex rounded-full border border-orange-300/50 px-4 py-2 text-sm font-semibold text-orange-100" to={`/admin/operations/${project.id}`}>Open project</Link>
  </article>
}

function ProjectDetail({ project, loading, error, busy, onAction }) {
  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading Operations project…</main>
  if (!project) return <main className="min-h-screen bg-slate-950 p-8 text-white"><Link to="/admin/operations" className="text-orange-200">← Operations</Link><p role="alert" className="mt-8 text-rose-200">{error || 'Operations project not found.'}</p></main>
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-6xl"><Link to="/admin/operations" className="text-sm font-semibold text-orange-200">← Operations</Link>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-rose-100">{error}</p>}
    <div className="mt-8 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">{project.client?.name || 'Client unavailable'}</p><h1 className="mt-3 text-4xl font-semibold">{project.name}</h1><p className="mt-2 text-slate-400">{projectTypeLabel(project.project_type)}</p></div><Readiness readiness={project.readiness} /></div>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Delivery state</h2><p className="mt-1 text-sm text-slate-300">{stateLabel(project.delivery_state)} · {project.human_reason}</p></div><ProjectStatus project={project} busy={busy} onAction={onAction} /></div></section>
    <section className="mt-8"><h2 className="text-2xl font-semibold">Readiness checklist</h2><p className="mt-1 text-sm text-slate-400">Mark the fixed intake requirements that matter for this project. CWS/client ownership is used only to derive the waiting state.</p><div className="mt-5 space-y-4">{project.requirements.map((requirement) => <RequirementRow key={requirement.id} requirement={requirement} busy={busy} onAction={onAction} />)}</div></section>
  </div></main>
}

function ProjectStatus({ project, busy, onAction }) {
  const [status, setStatus] = useState(project.status)
  useEffect(() => setStatus(project.status), [project.status])
  return <div className="flex flex-wrap gap-2"><select aria-label="Project status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl bg-slate-900 p-3">{PROJECT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" disabled={busy || status === project.status} onClick={() => onAction({ action: 'update_operations_project', project_id: project.id, status })} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:opacity-50">Save status</button></div>
}

function RequirementRow({ requirement, busy, onAction }) {
  const [values, setValues] = useState(requirementValues(requirement))
  useEffect(() => setValues(requirementValues(requirement)), [requirement])
  return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">{categoryLabel(requirement.category)}</p><h3 className="mt-1 text-lg font-semibold">{requirement.label}</h3>{requirement.received_at && <p className="mt-1 text-xs text-emerald-200">Received {formatDate(requirement.received_at)}</p>}</div><p className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">{stateLabel(requirement.status)}</p></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3"><Select label="Status" value={values.status} options={REQUIREMENT_STATUSES} onChange={(status) => setValues({ ...values, status })} /><Select label="Timing" value={values.timing} options={REQUIREMENT_TIMINGS} onChange={(timing) => setValues({ ...values, timing })} /><Select label="Waiting on" value={values.responsible_party} options={RESPONSIBLE_PARTIES} onChange={(responsible_party) => setValues({ ...values, responsible_party })} /></div>
    <textarea aria-label={`${requirement.label} notes`} value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} maxLength="2000" placeholder="Short readiness note (optional)" rows="2" className="mt-3 w-full rounded-xl bg-slate-900 p-3 text-sm" />
    <button type="button" disabled={busy || sameRequirementValues(values, requirement)} onClick={() => onAction({ action: 'update_project_requirement', requirement_id: requirement.id, ...values })} className="mt-3 rounded-full border border-orange-300/50 px-4 py-2 text-sm font-semibold text-orange-100 disabled:opacity-50">Save requirement</button>
  </article>
}

function Select({ label, value, options, onChange }) { return <label className="text-sm text-slate-300">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl bg-slate-900 p-3 text-white">{options.map(([option, optionLabel]) => <option key={option} value={option}>{optionLabel}</option>)}</select></label> }
function Readiness({ readiness }) { return <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-right"><p className="text-xs uppercase tracking-wide text-slate-400">Readiness</p><p className="mt-1 text-xl font-semibold">{readiness.percent}%</p><p className="text-xs text-slate-400">{readiness.received_count}/{readiness.applicable_count} received</p></div> }
function requirementValues(requirement) { return { status: requirement.status, timing: requirement.timing, responsible_party: requirement.responsible_party, notes: requirement.notes || '' } }
function sameRequirementValues(values, requirement) { return values.status === requirement.status && values.timing === requirement.timing && values.responsible_party === requirement.responsible_party && values.notes === (requirement.notes || '') }
function projectTypeLabel(value) { return PROJECT_TYPES.find(([type]) => type === value)?.[1] || value }
function stateLabel(value) { return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function categoryLabel(value) { return stateLabel(value) }
function formatDate(value) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) }
