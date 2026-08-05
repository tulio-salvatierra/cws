import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setSubmitting(false)
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError(err.message || 'Sign in failed')
      setSubmitting(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await resetPassword(email)
    if (error) setError(error.message)
    else setSent(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={forgot ? handleReset : handleSubmit}
        className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-white text-xl font-semibold">{forgot ? 'Reset your password' : 'Cicero Admin'}</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {sent && <p className="text-emerald-400 text-sm">Check your email for a password reset link.</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        {!forgot && <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />}
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {submitting ? 'Please wait…' : forgot ? 'Send reset link' : 'Sign in'}
        </button>
        <button type="button" onClick={() => { setForgot(!forgot); setError(null); setSent(false) }} className="text-xs text-gray-400 hover:text-white">
          {forgot ? 'Back to sign in' : 'Forgot password?'}
        </button>
      </form>
    </div>
  )
}
