import { useState } from 'react'

export default function UnsubscribePage() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const subscriberId = params.get('subscriber_id')
  const [state, setState] = useState('ready')
  const [error, setError] = useState('')
  const valid = Boolean(token) !== Boolean(subscriberId)

  async function unsubscribe() {
    setState('saving')
    setError('')
    try {
      const response = await fetch('/api/outreach/unsubscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { token } : { subscriber_id: subscriberId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Please try again.')
      setState('done')
    } catch (failure) { setError(failure.message); setState('ready') }
  }

  return <main className="min-h-screen bg-slate-950 px-6 py-20 text-white"><div className="mx-auto max-w-xl">
    <p className="text-sm text-orange-200">Cicero Web Studio</p>
    <h1 className="mt-4 text-3xl font-semibold">{state === 'done' ? 'You are unsubscribed' : 'Unsubscribe from marketing emails'}</h1>
    {state === 'done' ? <p role="status" className="mt-5">You will no longer receive Cicero Web Studio marketing emails.</p> : <>
      <p className="mt-5">Stop all marketing emails from Cicero Web Studio. No login is required.</p>
      {!valid && <p role="alert" className="mt-5">Open the unsubscribe link from your email.</p>}
      {error && <p role="alert" className="mt-5">{error}</p>}
      <button type="button" disabled={!valid || state === 'saving'} onClick={unsubscribe} className="mt-6 rounded-full bg-orange-300 px-6 py-3 font-semibold text-slate-950 disabled:opacity-50">{state === 'saving' ? 'Saving…' : 'Unsubscribe'}</button>
    </>}
  </div></main>
}
