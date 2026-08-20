import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const payload = await response.json()
  if (!response.ok && response.status !== 207) throw new Error(payload.error || 'Outreach request failed.')
  return payload
}

export default function MailingListPage() {
  const [subscribers, setSubscribers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [templates, setTemplates] = useState([])
  const [templateId, setTemplateId] = useState('')
  const [form, setForm] = useState({ name: '', email: '', source: 'manual' })
  const [modalOpen, setModalOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const activeSubscribers = subscribers.filter((subscriber) => !subscriber.unsubscribed_at)
  const selectedTemplate = templates.find((template) => template.id === templateId)

  async function loadSubscribers() {
    try {
      setError('')
      setSubscribers((await request('/api/outreach/subscribers')).subscribers)
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  useEffect(() => { loadSubscribers() }, [])
  useEffect(() => {
    if (!modalOpen) return
    request('/api/outreach/templates?type=mailing_list')
      .then((response) => {
        setTemplates(response.templates)
        setTemplateId(response.templates[0]?.id || '')
      })
      .catch((loadError) => setError(loadError.message))
  }, [modalOpen])

  function toggleSubscriber(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  }

  async function addSubscriber(event) {
    event.preventDefault()
    try {
      await request('/api/outreach/subscribers', { method: 'POST', body: JSON.stringify(form) })
      setForm({ name: '', email: '', source: 'manual' })
      await loadSubscribers()
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  async function send() {
    try {
      setSending(true)
      const response = await request('/api/outreach/mailing-list-send', {
        method: 'POST',
        body: JSON.stringify({ subscriber_ids: selectedIds, template_id: templateId }),
      })
      const sentCount = response.sends.length - response.failed_count
      setResult(`${sentCount} email${sentCount === 1 ? '' : 's'} sent${response.failed_count ? `; ${response.failed_count} failed` : ''}.`)
      setSelectedIds([])
      setModalOpen(false)
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setSending(false)
    }
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-6xl"><Link className="text-sm font-semibold text-orange-300" to="/admin/workspace">← Workspace</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Outreach</p><h1 className="mt-3 text-4xl font-semibold">Mailing List</h1><p className="mt-3 text-slate-400">Add subscribers, choose recipients, then review a single template before every bulk send.</p>{error && <p role="alert" className="mt-6 text-rose-300">{error}</p>}{result && <p role="status" className="mt-6 text-emerald-300">{result}</p>}<form onSubmit={addSubscriber} className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-4"><input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl bg-slate-900 p-3" /><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-xl bg-slate-900 p-3" /><input placeholder="Source" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="rounded-xl bg-slate-900 p-3" /><button className="rounded-xl bg-orange-300 px-4 py-3 font-semibold text-slate-950">Add subscriber</button></form><div className="mt-8 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-slate-400">{selectedIds.length} selected</p><button disabled={!selectedIds.length} onClick={() => { setError(''); setResult(''); setModalOpen(true) }} className="rounded-full bg-orange-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">Send to selected</button></div><div className="mt-4 overflow-x-auto rounded-3xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/[0.04] text-slate-400"><tr><th className="p-4"><input aria-label="Select all active subscribers" type="checkbox" checked={activeSubscribers.length > 0 && selectedIds.length === activeSubscribers.length} onChange={(event) => setSelectedIds(event.target.checked ? activeSubscribers.map((subscriber) => subscriber.id) : [])} /></th><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Source</th><th className="p-4">Subscribed</th><th className="p-4">Status</th></tr></thead><tbody>{subscribers.map((subscriber) => <tr className="border-t border-white/10" key={subscriber.id}><td className="p-4">{subscriber.unsubscribed_at ? '—' : <input aria-label={`Select ${subscriber.email}`} type="checkbox" checked={selectedIds.includes(subscriber.id)} onChange={() => toggleSubscriber(subscriber.id)} />}</td><td className="p-4">{subscriber.name || '—'}</td><td className="p-4">{subscriber.email}</td><td className="p-4">{subscriber.source || '—'}</td><td className="p-4">{new Date(subscriber.subscribed_at).toLocaleDateString()}</td><td className="p-4">{subscriber.unsubscribed_at ? 'Unsubscribed' : 'Subscribed'}</td></tr>)}</tbody></table>{!subscribers.length && <p className="p-5 text-slate-400">No subscribers yet.</p>}</div>{modalOpen && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5"><div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-2xl font-semibold">Review mailing-list email</h2><p className="mt-2 text-slate-400">This will send to {selectedIds.length} selected subscriber{selectedIds.length === 1 ? '' : 's'}.</p><select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="mt-5 w-full rounded-xl bg-slate-800 p-3">{templates.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select>{selectedTemplate ? <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4"><p className="font-semibold">{selectedTemplate.subject}</p><p className="whitespace-pre-wrap text-slate-300">{selectedTemplate.body.replaceAll('{{unsubscribe_url}}', 'https://www.cicerowebstudio.xyz/unsubscribe?subscriber_id=…')}</p><p className="text-sm text-amber-200">Each email includes its own unsubscribe link.</p></div> : <p className="mt-5 text-amber-200">No mailing-list template is available yet.</p>}<button disabled={!templateId || sending} onClick={send} className="mt-5 rounded-full bg-orange-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{sending ? 'Sending…' : `Confirm and send to ${selectedIds.length}`}</button><button onClick={() => setModalOpen(false)} className="ml-3 mt-5 text-slate-400">Cancel</button></div></div>}</div></main>
}
