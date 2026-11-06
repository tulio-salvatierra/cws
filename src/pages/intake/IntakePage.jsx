import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import IntakeField from './IntakeField'
import { initialAnswers, initialValue, serviceFields, summarize, validateAnswers, hasAnswer } from '../../lib/intake/model.js'
import './IntakePage.css'
const modules = import.meta.glob('../../content/intake/*.json', { eager: true, import: 'default' })
const configs = Object.values(modules)
function IntakeForm({ config }) {
  const storageKey = `cws:intake:${config.slug}:v1`
  const [answers, setAnswers] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (saved) return validateAnswers(config, saved) } catch { /* Draft unavailable or stale; use current config. */ }
    return initialAnswers(config)
  })
  const [storageStatus, setStorageStatus] = useState('')
  const [sendStatus, setSendStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [showCopy, setShowCopy] = useState(false)
  const summary = summarize(config, answers)
  const answered = answers.services.filter(s => hasAnswer(s.fields.status)).length
  useEffect(() => {
    const timer = setTimeout(() => { try { localStorage.setItem(storageKey, JSON.stringify(answers)); setStorageStatus('Saved on this device') } catch { setStorageStatus('Device saving is unavailable — copy or download before leaving') } }, 300)
    return () => clearTimeout(timer)
  }, [answers, storageKey])
  function change(next) { setAnswers(next); setSendStatus('idle'); setMessage(''); setStorageStatus('Saving on this device…') }
  function updateService(index, patch) { change({ ...answers, services: answers.services.map((s, i) => i === index ? { ...s, ...patch } : s) }) }
  async function submit(event) {
    event.preventDefault(); setSendStatus('sending'); setMessage('')
    try {
      validateAnswers(config, answers)
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 25000)
      let response, result
      try { response = await fetch('/api/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: config.slug, answers, website }), signal: controller.signal }); result = await response.json() } finally { clearTimeout(timer) }
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to send your answers')
      setSendStatus('success'); setMessage('Your answers were sent to Tulio. Thank you!')
    } catch (error) { setSendStatus('error'); setShowCopy(true); setMessage(error.name === 'AbortError' ? 'The send timed out. Please copy or download your answers, or try again.' : error.message) }
  }
  async function copy() { try { await navigator.clipboard.writeText(summary); setMessage('Answers copied') } catch { setShowCopy(true); setMessage('Select and copy your answers below') } }
  function download() { const url = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `intake-${config.slug}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
  return <main className="intake-page"><a className="intake-brand" href="/" aria-label="Cicero Web Studio home">CWS<span> / Client intake</span></a><header><p className="intake-eyebrow">Your website starts here</p><h1>{config.greeting}</h1><p className="intake-intro">{config.intro}</p></header>
    <div className="intake-progress"><p>{answered} of {answers.services.length} services answered</p><progress aria-label="Services with a status answer" max={Math.max(1, answers.services.length)} value={answered} /><p className="intake-help" role="status">{storageStatus}</p></div>
    <form onSubmit={submit}><fieldset disabled={sendStatus === 'sending'} className="intake-form-body">
      {config.sections.map(section => <section className="intake-section" key={section.id}><h2>{section.title}</h2>{section.fields.map(field => <IntakeField key={field.id} field={field} value={answers.sections[section.id]?.[field.id]} onChange={value => change({ ...answers, sections: { ...answers.sections, [section.id]: { ...answers.sections[section.id], [field.id]: value } } })} />)}</section>)}
      <section className="intake-section"><h2>Your services</h2><p>Choose a status for each service. Review every suggestion before sending.</p>{answers.services.map((service, index) => { const definition = config.services.find(s => s.id === service.id); return <details className="intake-service" key={service.id} open={undefined}><summary>{service.name || 'New service'}<span>{service.fields.status?.notSure ? 'Not sure' : service.fields.status?.selected?.[0] || 'Not answered'}</span></summary><div className="intake-service-body">{!definition && <label className="intake-field">Service name<input value={service.name} maxLength={160} onChange={e => updateService(index, { name: e.target.value })} /></label>}{serviceFields(config, definition).map(field => <IntakeField key={field.id} field={field} value={service.fields[field.id]} onChange={value => updateService(index, { fields: { ...service.fields, [field.id]: value } })} />)}{!definition && <button type="button" onClick={() => { if (window.confirm('Remove this service and its answers?')) change({ ...answers, services: answers.services.filter(s => s.id !== service.id) }) }}>Remove service</button>}</div></details> })}
      {config.allowAddService && <button type="button" disabled={answers.services.length >= 30} onClick={() => change({ ...answers, services: [...answers.services, { id: `custom-${crypto.randomUUID()}`, name: '', fields: Object.fromEntries(serviceFields(config).map(f => [f.id, initialValue(f)])) }] })}>Add another service</button>}</section>
      <div className="intake-honeypot" aria-hidden="true"><label>Website<input name="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
      <section className="intake-section"><h2>Review and send</h2><p>Your answers go to Tulio by email with a JSON attachment. A draft stays on this device until you start over. No database record is created.</p><details className="intake-review"><summary>Review my answers</summary><pre>{summary}</pre></details><div className="intake-actions"><button className="intake-primary" type="submit" disabled={sendStatus === 'success'}>{sendStatus === 'sending' ? 'Sending…' : sendStatus === 'success' ? 'Sent to Tulio' : 'Send to Tulio'}</button><button type="button" onClick={copy}>Copy my answers</button><button type="button" onClick={download}>Download as .txt</button></div></section>
      <button type="button" onClick={() => { if (window.confirm('Start over? This will remove your saved answers on this device.')) { try { localStorage.removeItem(storageKey) } catch { /* Form remains usable. */ } change(initialAnswers(config)); setShowCopy(false) } }}>Start over</button>
    </fieldset></form>
    {message && <p className="intake-message" role={sendStatus === 'error' ? 'alert' : 'status'}>{message}</p>}
    {showCopy && <div className="intake-field"><label htmlFor="intake-copy">Your answers — select and copy</label><textarea id="intake-copy" rows={14} readOnly value={summary} onFocus={e => e.target.select()} /><button type="button" onClick={download}>Download as .txt</button></div>}
  </main>
}
export default function IntakePage() {
  const { slug } = useParams()
  const config = configs.find(c => c.slug === slug)
  useEffect(() => {
    const oldTitle = document.title; document.title = config ? `${config.clientName} — Intake | Cicero Web Studio` : 'Intake not found | Cicero Web Studio'
    let meta = document.querySelector('meta[name="robots"]'); const previous = meta?.content
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.append(meta) }
    meta.content = 'noindex, nofollow'
    return () => { document.title = oldTitle; if (previous === undefined) meta.remove(); else meta.content = previous }
  }, [config])
  return config ? <IntakeForm key={config.slug} config={config} /> : <main className="intake-page"><h1>Intake not found</h1><p>This intake link does not exist.</p><a href="/">Return to CWS</a></main>
}
