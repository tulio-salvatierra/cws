import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// DEC-041: owner-issued, read-only tokens for connecting Claude to CWS OS over MCP.
async function callCeoToday(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const result = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, 'Content-Type': 'application/json' },
  })
  const payload = await result.json()
  if (!result.ok) throw new Error(payload.error || 'The request failed.')
  return payload
}

export default function McpTokens({ canManage }) {
  const [tokens, setTokens] = useState(null)
  const [label, setLabel] = useState('')
  const [created, setCreated] = useState(null)
  const [confirmRevoke, setConfirmRevoke] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!canManage) return null

  async function load() {
    setError('')
    try { setTokens((await callCeoToday('/api/ceo-today?view=mcp_tokens')).mcp_tokens) }
    catch (loadError) { setError(loadError.message) }
  }

  async function create(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await callCeoToday('/api/ceo-today', { method: 'POST', body: JSON.stringify({ action: 'mcp_token_create', label }) })
      setCreated(payload.token)
      setLabel('')
      await load()
    } catch (createError) { setError(createError.message) }
    finally { setBusy(false) }
  }

  async function revoke(id) {
    setBusy(true)
    setError('')
    try {
      await callCeoToday('/api/ceo-today', { method: 'POST', body: JSON.stringify({ action: 'mcp_token_revoke', token_id: id }) })
      setConfirmRevoke(null)
      await load()
    } catch (revokeError) { setError(revokeError.message) }
    finally { setBusy(false) }
  }

  const origin = typeof window === 'undefined' ? 'https://cicerowebstudio.xyz' : window.location.origin
  return <details className="mt-7 rounded-2xl border border-gray-800 bg-gray-900/60 p-5" onToggle={event => { if (event.currentTarget.open && tokens === null) void load() }}>
    <summary className="cursor-pointer text-lg font-semibold text-white">Claude connection (MCP)</summary>
    <p className="mt-3 text-sm text-gray-300">Read-only access to CWS OS from your own Claude client. It can read CEO Today; it cannot send, publish, or change anything. Tokens never expire. Revoke any you no longer use.</p>
    <p className="mt-2 text-xs text-gray-400">What Claude reads (client names, emails, amounts) is processed under your Claude account. Don’t issue tokens for shared accounts.</p>
    {error && <p role="alert" className="mt-3 text-rose-200">{error}</p>}
    {created && <div role="status" className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/5 p-3 text-sm text-gray-200">
      <p className="font-semibold text-emerald-200">Copy this token now. It won’t be shown again.</p>
      <code className="mt-2 block break-all rounded bg-gray-800 p-2 text-xs">{created}</code>
      <p className="mt-3 text-xs text-gray-400">Claude Code:</p>
      <code className="mt-1 block break-all rounded bg-gray-800 p-2 text-xs">{`claude mcp add --transport http cws ${origin}/api/mcp --header "Authorization: Bearer ${created}"`}</code>
      <button type="button" className="mt-3 text-sm text-gray-400" onClick={() => setCreated(null)}>I saved it</button>
    </div>}
    <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={create}>
      <label className="text-sm text-gray-200">Label<input required maxLength={80} value={label} onChange={event => setLabel(event.target.value)} placeholder="Claude Desktop – MacBook" className="ml-3 rounded bg-gray-800 p-2" /></label>
      <button disabled={busy || !label.trim()} className="rounded bg-indigo-500 px-3 py-2 text-sm text-white disabled:opacity-50">Create token</button>
    </form>
    {tokens && <ul className="mt-4 space-y-2 text-sm text-gray-300">
      {!tokens.length && <li className="text-gray-400">No tokens yet.</li>}
      {tokens.map(token => <li key={token.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-800 pt-2">
        <span>{token.label} · <code className="text-xs">{token.token_prefix}…</code> · created {token.created_at?.slice(0, 10)} · {token.last_used_at ? `last used ${token.last_used_at.slice(0, 10)}` : 'never used'}{token.revoked_at ? ` · revoked ${token.revoked_at.slice(0, 10)}` : ''}</span>
        {!token.revoked_at && (confirmRevoke === token.id
          ? <span className="flex gap-3"><button type="button" disabled={busy} className="text-rose-200" onClick={() => revoke(token.id)}>Confirm revoke</button><button type="button" className="text-gray-400" onClick={() => setConfirmRevoke(null)}>Cancel</button></span>
          : <button type="button" disabled={busy} className="text-rose-200" onClick={() => setConfirmRevoke(token.id)}>Revoke</button>)}
      </li>)}
    </ul>}
  </details>
}
