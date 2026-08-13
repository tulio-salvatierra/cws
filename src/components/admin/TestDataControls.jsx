import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const RESOURCE_CONFIG = {
  campaign: { table: 'campaigns', label: 'campaign' },
  variant: { table: 'content_variants', label: 'content variant' },
}

export default function TestDataControls({ resourceType, record, workspaceId, isOwner, onUpdated }) {
  const config = RESOURCE_CONFIG[resourceType]
  const [pendingAction, setPendingAction] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (!config) return null

  async function updateClassification(payload, successMessage) {
    setSaving(true)
    setError('')
    setMessage('')

    const result = await supabase
      .from(config.table)
      .update(payload)
      .eq('id', record.id)
      .eq('workspace_id', workspaceId)
      .select('is_test, test_archived, test_archived_at, test_archived_by')
      .single()

    if (result.error) {
      setError(result.error.message)
    } else {
      onUpdated(result.data)
      setPendingAction(null)
      setMessage(successMessage)
    }
    setSaving(false)
  }

  if (!isOwner) {
    if (!record.is_test) return null
    return <p className="mt-4 text-sm text-amber-200">Test data{record.test_archived ? ' · operationally archived' : ''}</p>
  }

  return <section className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-300/[0.04] p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Test-data controls</p>
    <h2 className="mt-2 text-xl font-semibold">Keep feature tests out of operational views</h2>
    <p className="mt-2 text-sm text-slate-400">Labeling does not change lifecycle status, approvals, exports, or publishing evidence. Archiving hides this {config.label} from normal workspace lists and can be reversed.</p>

    <div className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={saving || record.test_archived}
        onClick={() => updateClassification(
          { is_test: !record.is_test },
          record.is_test ? 'Test label removed.' : 'Record labeled as test data.',
        )}
        className="rounded-full border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 disabled:opacity-50"
      >
        {record.is_test ? 'Remove test label' : 'Mark as test data'}
      </button>

      {record.is_test && !record.test_archived && <button
        type="button"
        disabled={saving}
        onClick={() => setPendingAction('archive')}
        className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
      >Archive test data</button>}

      {record.test_archived && <button
        type="button"
        disabled={saving}
        onClick={() => setPendingAction('restore')}
        className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
      >Restore to operational views</button>}
    </div>

    {pendingAction && <div role="alertdialog" aria-label={pendingAction === 'archive' ? 'Confirm test archive' : 'Confirm test restore'} className="mt-4 rounded-2xl border border-amber-300/30 bg-slate-950/70 p-4">
      <p className="font-semibold">{pendingAction === 'archive' ? 'Archive this test record?' : 'Restore this test record?'}</p>
      <p className="mt-1 text-sm text-slate-400">{pendingAction === 'archive'
        ? 'It will leave normal operational lists while all lifecycle and evidence records remain intact.'
        : 'It will appear in normal operational lists again. Its test label will remain.'}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => updateClassification(
            { test_archived: pendingAction === 'archive' },
            pendingAction === 'archive' ? 'Test record archived.' : 'Test record restored.',
          )}
          className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >{saving ? 'Saving…' : pendingAction === 'archive' ? 'Confirm archive' : 'Confirm restore'}</button>
        <button type="button" disabled={saving} onClick={() => setPendingAction(null)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50">Cancel</button>
      </div>
    </div>}

    {record.is_test && <p className="mt-4 text-sm text-amber-100">Test data{record.test_archived ? ` · archived ${record.test_archived_at ? new Date(record.test_archived_at).toLocaleString() : ''}` : ''}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
    {message && <p role="status" className="mt-4 text-sm text-emerald-300">{message}</p>}
  </section>
}
