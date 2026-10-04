import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LayaAdvisory from './LayaAdvisory'

export default function AssetEvaluator({ onSaved }) {
  const [channels, setChannels] = useState([])
  const [channel, setChannel] = useState('')
  const [topic, setTopic] = useState('')
  const [draft, setDraft] = useState('')
  const [language, setLanguage] = useState('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [assessment, setAssessment] = useState(null)
  useEffect(() => { supabase.from('channels').select('id,name').then(({ data, error }) => { if (error) setError(error.message); else { setChannels(data || []); setChannel(data?.[0]?.id || '') } }) }, [])
  async function evaluate(event) {
    event.preventDefault(); setBusy(true); setError(''); setAssessment(null)
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error('Sign in again to evaluate.')
      const response = await fetch('/api/laya-assess', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ channel_id: channel, language, topic, draft }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) throw new Error(result.error || 'Evaluation failed.')
      setAssessment(result.laya); await onSaved()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <form onSubmit={evaluate} className="mt-8 rounded-2xl border border-sky-300/30 p-6">
    <h2 className="text-2xl font-semibold">Evaluate a social media asset</h2>
    <p className="mt-2 text-sm text-slate-400">Paste a caption, slide text, or video script. Laya uses the active channel brief. Text evaluation only; allow up to a minute.</p>
    <label className="mt-4 block">Channel<select className="block bg-slate-900 p-2" value={channel} onChange={e => setChannel(e.target.value)} required>{channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="mt-4 block">Brief language<select className="block bg-slate-900 p-2" value={language} onChange={e => setLanguage(e.target.value)}><option value="en">English</option><option value="es">Spanish</option></select></label>
    <label className="mt-4 block">Topic, platform, and goal<input className="block w-full bg-slate-900 p-3" value={topic} onChange={e => setTopic(e.target.value)} maxLength={500} required /></label>
    <label className="mt-4 block">Asset text<textarea className="block w-full bg-slate-900 p-3" rows={8} value={draft} onChange={e => setDraft(e.target.value)} maxLength={20000} required /></label>
    <button disabled={busy || !channel} className="mt-4 rounded-full bg-sky-200 px-5 py-3 text-slate-950 disabled:opacity-50">{busy ? 'Evaluating…' : 'Evaluate asset'}</button>
    {error && <p role="alert">{error}</p>}
    {assessment?.status === 'not_configured' && <p>Laya is not configured on this server.</p>}
    <LayaAdvisory assessment={assessment} />
  </form>
}
