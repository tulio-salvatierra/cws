import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function NewVariantPage() {
  const { campaignId, channelId: routeChannelId } = useParams()
  const navigate = useNavigate()
  const [workspaceId, setWorkspaceId] = useState(null)
  const [channels, setChannels] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [form, setForm] = useState({ channel_id: routeChannelId || '', campaign_id: campaignId || '', code: '', locale: 'en', working_title: '', transcript: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const membership = await supabase.from('workspace_members').select('workspace_id').eq('status', 'active').order('created_at').limit(1).single()
      if (membership.error) throw membership.error
      const workspace = membership.data.workspace_id
      const [channelsResult, campaignsResult] = await Promise.all([
        supabase.from('channels').select('id, name, slug').eq('workspace_id', workspace).order('name'),
        supabase.from('campaigns').select('id, code, title, channel_id').eq('workspace_id', workspace).order('code'),
      ])
      if (channelsResult.error) throw channelsResult.error
      if (campaignsResult.error) throw campaignsResult.error
      if (!active) return
      const nextChannels = channelsResult.data || []
      const nextCampaigns = campaignsResult.data || []
      const campaign = nextCampaigns.find((item) => item.id === campaignId)
      setWorkspaceId(workspace)
      setChannels(nextChannels)
      setCampaigns(nextCampaigns)
      setForm((current) => ({
        ...current,
        channel_id: routeChannelId || campaign?.channel_id || current.channel_id || nextChannels[0]?.id || '',
        campaign_id: campaignId || current.campaign_id || '',
      }))
    }
    load().catch((loadError) => active && setError(loadError.message || 'Unable to load channels.'))
    return () => { active = false }
  }, [campaignId, routeChannelId])

  const availableCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.channel_id === form.channel_id),
    [campaigns, form.channel_id],
  )

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'channel_id' && current.campaign_id && !campaigns.some((campaign) => campaign.id === current.campaign_id && campaign.channel_id === value) ? { campaign_id: '' } : {}),
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.channel_id) { setError('Select a channel before creating the variant.'); return }
    setSaving(true)
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user?.user) { setError(userError?.message || 'Unable to identify the current user.'); setSaving(false); return }
    const result = await supabase.from('content_variants').insert({
      code: form.code.toUpperCase(),
      locale: form.locale,
      working_title: form.working_title,
      transcript: form.transcript,
      channel_id: form.channel_id,
      campaign_id: form.campaign_id || null,
      workspace_id: workspaceId,
      created_by: user.user.id,
    }).select('id').single()
    if (result.error) { setError(result.error.message); setSaving(false) }
    else navigate(`/admin/variants/${result.data.id}`)
  }

  const backLink = campaignId ? `/admin/campaigns/${campaignId}` : form.channel_id ? '/admin/channels' : '/admin/workspace'
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10 md:py-12"><div className="mx-auto max-w-3xl">
    <Link className="text-sm font-semibold text-orange-300" to={backLink}>← {campaignId ? 'Campaign' : 'Channels'}</Link>
    <h1 className="mt-10 text-4xl font-semibold">New content variant</h1>
    <p className="mt-3 max-w-2xl text-slate-400">Every variant belongs to a channel. A campaign is optional while content is being developed.</p>
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <label className="block text-sm text-slate-300">Channel
        <select required name="channel_id" aria-label="Channel" value={form.channel_id} onChange={updateField} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white">
          <option value="">Select a channel</option>{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
        </select>
      </label>
      <label className="block text-sm text-slate-300">Campaign <span className="text-slate-500">(optional)</span>
        <select name="campaign_id" aria-label="Campaign" value={form.campaign_id} onChange={updateField} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white">
          <option value="">No campaign yet</option>{availableCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.code} · {campaign.title}</option>)}
        </select>
      </label>
      <input required name="code" placeholder="Code (CWS-002-EN-MASTER)" value={form.code} onChange={updateField} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
      <select name="locale" aria-label="Locale" value={form.locale} onChange={updateField} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"><option value="en">English</option><option value="es">Spanish</option></select>
      <input required name="working_title" placeholder="Working title" value={form.working_title} onChange={updateField} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
      <textarea name="transcript" placeholder="Transcript or script" rows="6" value={form.transcript} onChange={updateField} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" />
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <button disabled={!workspaceId || saving} className="rounded-full bg-orange-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Creating…' : 'Create variant'}</button>
    </form>
  </div></main>
}
