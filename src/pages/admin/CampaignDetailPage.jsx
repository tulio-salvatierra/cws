import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import TestDataControls from '../../components/admin/TestDataControls'

const CAMPAIGN_STATUSES = [
  'idea',
  'selected',
  'planning',
  'preproduction',
  'recording',
  'editing',
  'review',
  'ready',
  'published',
  'measuring',
  'archived',
]

const CAMPAIGN_FIELDS = 'id, code, title, status, description, is_test, test_archived, test_archived_at, test_archived_by'

function statusLabel(status) {
  return status.replaceAll('_', ' ')
}

export default function CampaignDetailPage() {
  const { campaignId } = useParams()
  const [state, setState] = useState({ loading: true, error: '', campaign: null, variants: [], workspaceId: null, membershipRole: null })
  const [showArchivedTests, setShowArchivedTests] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const membership = await supabase.from('workspace_members').select('workspace_id, role').eq('status', 'active').order('created_at').limit(1).single()
      if (membership.error) throw membership.error

      const workspaceId = membership.data.workspace_id
      const [campaign, variants] = await Promise.all([
        supabase.from('campaigns').select(CAMPAIGN_FIELDS).eq('id', campaignId).eq('workspace_id', workspaceId).single(),
        supabase.from('content_variants').select('id, code, locale, working_title, status, is_test, test_archived, test_archived_at').eq('campaign_id', campaignId).eq('workspace_id', workspaceId).order('code'),
      ])
      if (campaign.error) throw campaign.error
      if (variants.error) throw variants.error

      if (active) {
        setState({ loading: false, error: '', campaign: campaign.data, variants: variants.data || [], workspaceId, membershipRole: membership.data.role })
        setSelectedStatus(campaign.data.status)
      }
    }

    load().catch((error) => active && setState({ loading: false, error: error.message, campaign: null, variants: [], workspaceId: null, membershipRole: null }))
    return () => { active = false }
  }, [campaignId])

  async function saveStatus(event) {
    event.preventDefault()
    setSavingStatus(true)
    setStatusError('')
    setStatusMessage('')

    const result = await supabase.from('campaigns')
      .update({ status: selectedStatus })
      .eq('id', campaignId)
      .eq('workspace_id', state.workspaceId)
      .select(CAMPAIGN_FIELDS)
      .single()

    if (result.error) {
      setStatusError(result.error.message)
    } else {
      setState((current) => ({ ...current, campaign: result.data }))
      setSelectedStatus(result.data.status)
      setStatusMessage('Campaign status saved.')
    }
    setSavingStatus(false)
  }

  if (state.loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading campaign…</div>
  if (state.error) return <main className="min-h-screen bg-slate-950 p-8 text-white"><p className="text-rose-300">{state.error}</p><Link className="mt-4 inline-block text-orange-300" to="/admin/campaigns">Back to campaigns</Link></main>

  const archivedTestCount = state.variants.filter((variant) => variant.test_archived).length
  const visibleVariants = showArchivedTests ? state.variants : state.variants.filter((variant) => !variant.test_archived)

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12">
    <div className="mx-auto max-w-4xl">
      <Link className="text-sm font-semibold text-orange-300" to="/admin/campaigns">← Campaigns</Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-orange-200">Campaign detail</p>
      <h1 className="mt-3 text-4xl font-semibold">{state.campaign.code}</h1>
      <p className="mt-2 text-xl text-slate-200">{state.campaign.title}</p>
      <p className="mt-6 leading-7 text-slate-300">{state.campaign.description}</p>
      {state.campaign.is_test && <p className="mt-4 inline-flex rounded-full border border-amber-300/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">Test data{state.campaign.test_archived ? ' · archived' : ''}</p>}

      <form onSubmit={saveStatus} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Campaign lifecycle</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-300">Status
            <select aria-label="Campaign status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white">
              {CAMPAIGN_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </label>
          <button disabled={savingStatus || selectedStatus === state.campaign.status} className="rounded-full bg-orange-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{savingStatus ? 'Saving…' : 'Save status'}</button>
        </div>
        {statusError && <p className="mt-4 text-sm text-rose-300">{statusError}</p>}
        {statusMessage && <p className="mt-4 text-sm text-emerald-300" role="status">{statusMessage}</p>}
      </form>

      <TestDataControls
        resourceType="campaign"
        record={state.campaign}
        workspaceId={state.workspaceId}
        isOwner={state.membershipRole === 'owner'}
        onUpdated={(classification) => setState((current) => ({ ...current, campaign: { ...current.campaign, ...classification } }))}
      />

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Content variants</h2>
          <Link className="rounded-full bg-orange-300 px-4 py-2 text-sm font-semibold text-slate-950" to={`/admin/campaigns/${campaignId}/variants/new`}>+ New variant</Link>
        </div>
        {archivedTestCount > 0 && <button type="button" onClick={() => setShowArchivedTests((shown) => !shown)} className="mt-4 text-sm font-semibold text-amber-200">{showArchivedTests ? 'Hide archived tests' : `Show archived tests (${archivedTestCount})`}</button>}
        <div className="mt-5 space-y-3">
          {visibleVariants.map((variant) => <Link className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4 hover:border-orange-300/50" key={variant.id} to={`/admin/variants/${variant.id}`}>
            <span>
              <span className="block font-semibold">{variant.working_title}</span>
              <span className="text-xs uppercase tracking-wide text-slate-500">{variant.locale} · {variant.code}</span>
              {variant.is_test && <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-amber-200">Test data{variant.test_archived ? ' · archived' : ''}</span>}
            </span>
            <span className="text-sm text-slate-400">{statusLabel(variant.status)}</span>
          </Link>)}
          {visibleVariants.length === 0 && <p className="text-sm text-slate-400">No operational content variants.</p>}
        </div>
      </section>
    </div>
  </main>
}
