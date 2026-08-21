import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const TYPES = ['intro', 'follow_up', 'cold']

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'Outreach request failed.')
  return payload
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', company: '', source: 'manual' })
  const [modal, setModal] = useState(null)
  const [templates, setTemplates] = useState([])
  const [type, setType] = useState('intro')
  const [templateId, setTemplateId] = useState('')
  const [draft, setDraft] = useState(null)
  const [sending, setSending] = useState(false)

  async function load() {
    try { setError(''); setLeads((await request('/api/outreach/leads')).leads) } catch (loadError) { setError(loadError.message) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!modal) return
    request(`/api/outreach/templates?type=${type}`).then((result) => {
      setTemplates(result.templates)
      setTemplateId(result.templates[0]?.id || '')
      setDraft(null)
    }).catch((loadError) => setError(loadError.message))
  }, [modal, type])

  async function addLead(event) {
    event.preventDefault()
    try { await request('/api/outreach/leads', { method: 'POST', body: JSON.stringify(form) }); setForm({ name: '', email: '', company: '', source: 'manual' }); await load() } catch (saveError) { setError(saveError.message) }
  }
  async function preview() {
    try { setDraft(await request('/api/outreach/draft', { method: 'POST', body: JSON.stringify({ lead_id: modal.id, template_id: templateId }) })) } catch (draftError) { setError(draftError.message) }
  }
  async function send() {
    if (!draft) return
    try {
      setSending(true)
      await request('/api/outreach/send', { method: 'POST', body: JSON.stringify({ lead_id: modal.id, template_id: templateId, send_type: type, subject: draft.subject, body: draft.body }) })
      setModal(null); setDraft(null); await load()
    } catch (sendError) { setError(sendError.message) } finally { setSending(false) }
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-6xl"><Link className="text-sm font-semibold text-orange-300" to="/admin/workspace">← Workspace</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Outreach</p><h1 className="mt-3 text-4xl font-semibold">Leads</h1><p className="mt-3 text-slate-400">Create a lead, prepare a personal draft, then explicitly confirm each send.</p>{error && <p role="alert" className="mt-6 text-rose-300">{error}</p>}<form onSubmit={addLead} className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-4"><input required placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl bg-slate-900 p-3" /><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-xl bg-slate-900 p-3" /><input placeholder="Company" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} className="rounded-xl bg-slate-900 p-3" /><button className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950">Add lead</button></form><div className="mt-8 overflow-x-auto rounded-3xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/[0.04] text-slate-400"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Company</th><th className="p-4">Status</th><th className="p-4">Last contacted</th><th className="p-4" /></tr></thead><tbody>{leads.map((lead) => <tr className="border-t border-white/10" key={lead.id}><td className="p-4">{lead.name || '—'}</td><td className="p-4">{lead.email}</td><td className="p-4">{lead.company || '—'}</td><td className="p-4">{lead.status}</td><td className="p-4">{lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString() : '—'}</td><td className="p-4"><button className="rounded-full border border-orange-300/50 px-3 py-1 font-semibold text-orange-200" onClick={() => { setModal(lead); setType('intro') }}>Send</button></td></tr>)}</tbody></table>{!leads.length && <p className="p-5 text-slate-400">No leads yet.</p>}</div>{modal && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5"><div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-2xl font-semibold">Prepare email for {modal.email}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl bg-slate-800 p-3">{TYPES.map((entry) => <option key={entry}>{entry}</option>)}</select><select value={templateId} onChange={(event) => { setTemplateId(event.target.value); setDraft(null) }} className="rounded-xl bg-slate-800 p-3">{templates.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></div><button disabled={!templateId} onClick={preview} className="mt-4 rounded-full border border-white/20 px-4 py-2 font-semibold">Preview draft</button>{draft && <div className="mt-5 space-y-3"><input aria-label="Email subject" value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} className="w-full rounded-xl bg-slate-800 p-3" /><textarea aria-label="Email body" rows="10" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} className="w-full rounded-xl bg-slate-800 p-3" /><p className="text-sm text-amber-200">Confirming sends this email to {modal.email}.</p><button disabled={sending} onClick={send} className="rounded-full bg-orange-300 px-5 py-3 font-semibold text-slate-950">{sending ? 'Sending…' : 'Confirm and send'}</button></div>}<button onClick={() => { setModal(null); setDraft(null) }} className="ml-3 mt-5 text-slate-400">Cancel</button></div></div>}</div></main>
}
