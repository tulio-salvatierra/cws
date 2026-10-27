import { useId, useState } from 'react'
import { CATALOG_CAPTION_PLATFORM_LABELS } from '../../marketing/platformCaptions.js'

const LANGUAGE_LABELS = { en: 'English', es: 'Spanish' }
const CAPTION_LIMITS = { '': 3000, meta: 2200, linkedin: 3000, google_business: 1500 }

export default function SavedOfferCaptions({ offer, saving, onSave }) {
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const formId = useId()

  async function save(event) {
    event.preventDefault()
    if (saving || !editing || !editing.body.trim() || editing.body.length > CAPTION_LIMITS[editing.platform]) return
    setError('')
    const saved = await onSave('save_marketing_offer_caption', { caption: editing })
    if (saved) {
      setEditing(null)
      setMessage('Caption updated.')
    } else {
      setError('Your changes were not saved. Your edits are still here; please try again.')
    }
  }

  function edit(caption) {
    setMessage('')
    setError('')
    setEditing({ id: caption.id, offer_id: offer.id, body: caption.body, locale: caption.locale, platform: caption.platform || '', status: caption.status })
  }

  function change(field, value) {
    setEditing(current => ({ ...current, [field]: value }))
  }

  return <section aria-label={`Saved captions for ${offer.name}`} className="mt-5 border-t border-gray-800 pt-4">
    <h4 className="text-sm font-semibold text-gray-100">Saved captions</h4>
    <p className="mt-1 text-xs leading-5 text-gray-400">Edits update the library. Review any weekly post separately before publishing.</p>
    {message && <p role="status" className="mt-3 text-sm text-emerald-200">{message}</p>}
    {!offer.captions.length && <p className="mt-3 text-sm text-gray-500">No saved captions yet.</p>}
    <ul className="mt-3 space-y-3">
      {offer.captions.map((caption, index) => <li key={caption.id} className="min-w-0 rounded-lg border border-gray-800 bg-gray-900/60 p-3 sm:p-4">
        <p className="text-xs font-medium text-indigo-100">{LANGUAGE_LABELS[caption.locale] || caption.locale} · {CATALOG_CAPTION_PLATFORM_LABELS[caption.platform || ''] || caption.platform} · {caption.status}</p>
        {editing?.id === caption.id ? <form aria-label={`Edit saved caption for ${offer.name}`} onSubmit={save} className="mt-3">
          <p className="text-sm font-semibold text-white">Edit caption for {offer.name}</p>
          <label htmlFor={`${formId}-body`} className="mt-3 block text-xs text-gray-400">Caption text</label>
          <textarea id={`${formId}-body`} autoFocus disabled={saving} required maxLength={CAPTION_LIMITS[editing.platform]} value={editing.body} onChange={event => change('body', event.target.value)} rows={5} className="mt-1 w-full resize-y rounded-lg border border-gray-700 bg-gray-950 p-3 text-sm leading-6 text-white" />
          <p className="mt-1 text-xs text-gray-500">{editing.body.length} / {CAPTION_LIMITS[editing.platform].toLocaleString('en-US')} characters</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-gray-400">Language<select disabled={saving} value={editing.locale} onChange={event => change('locale', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 p-2 text-sm text-white"><option value="en">English</option><option value="es">Spanish</option></select></label>
            <label className="block text-xs text-gray-400">Channel<select disabled={saving} value={editing.platform} onChange={event => change('platform', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 p-2 text-sm text-white">{Object.entries(CATALOG_CAPTION_PLATFORM_LABELS).map(([value, label]) => <option key={value || 'shared'} value={value}>{label}</option>)}</select></label>
            <label className="block text-xs text-gray-400">Status<select disabled={saving} value={editing.status} onChange={event => change('status', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 p-2 text-sm text-white"><option value="draft">Draft</option><option value="active">Active</option><option value="retired">Retired</option></select></label>
          </div>
          <p className="mt-3 text-xs text-gray-400">Spanish captions stay in the library; the current rotation uses English captions only.</p>
          {editing.body.length > CAPTION_LIMITS[editing.platform] && <p role="alert" className="mt-3 text-sm text-rose-200">Shorten this caption for the selected channel before saving.</p>}
          {error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={saving || !editing.body.trim() || editing.body.length > CAPTION_LIMITS[editing.platform]} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save caption changes'}</button>
            <button type="button" disabled={saving} onClick={() => { setEditing(null); setError('') }} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Cancel caption edit</button>
          </div>
        </form> : <>
          <p lang={caption.locale} className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-200">{caption.body}</p>
          {caption.locale === 'es' && <p className="mt-2 text-xs text-amber-100">Stored in Spanish; not used in the current English rotation.</p>}
          <button type="button" disabled={saving || Boolean(editing)} aria-label={`Edit caption ${index + 1} for ${offer.name}`} onClick={() => edit(caption)} className="mt-3 rounded-full border border-white/20 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Edit caption</button>
        </>}
      </li>)}
    </ul>
  </section>
}
