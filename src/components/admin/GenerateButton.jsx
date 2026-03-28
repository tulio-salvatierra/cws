import { useState } from 'react'

export default function GenerateButton({ webhookUrl }) {
  const [status, setStatus] = useState('idle') // idle | generating | done | error

  async function handleClick() {
    setStatus('generating')
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggered_by: 'dashboard' }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  const labels = {
    idle: '⚡ Generate Now',
    generating: 'Generating…',
    done: '✓ Triggered',
    error: '✗ Error — retry',
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'generating'}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        status === 'idle'       ? 'bg-indigo-600 hover:bg-indigo-500 text-white' :
        status === 'generating' ? 'bg-indigo-800 text-indigo-300 cursor-not-allowed' :
        status === 'done'       ? 'bg-green-800 text-green-300' :
                                   'bg-red-900 text-red-300'
      }`}
    >
      {labels[status]}
    </button>
  )
}
