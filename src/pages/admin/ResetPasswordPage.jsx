import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Hooks/useAuth'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    const { error: updateError } = await updatePassword(password)
    if (updateError) setError(updateError.message)
    else { setSaved(true); setTimeout(() => navigate('/admin'), 1000) }
  }
  return <div className="min-h-screen flex items-center justify-center bg-gray-950"><form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm flex flex-col gap-4"><h1 className="text-white text-xl font-semibold">Choose a new password</h1>{error && <p className="text-red-400 text-sm">{error}</p>}{saved && <p className="text-emerald-400 text-sm">Password updated. Redirecting…</p>}<input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" /><input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm" /><button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-medium">Update password</button></form></div>
}
