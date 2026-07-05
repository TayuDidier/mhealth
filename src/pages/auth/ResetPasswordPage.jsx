import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AppButton from '../../components/AppButton'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash — it processes it automatically
    // via onAuthStateChange. We just need to confirm the hash is a recovery type.
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setValidSession(true)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError('')
    setLoading(true)
    const { error: err } = await updatePassword(password)
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate('/login'), 2500)
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-pink mb-4">
            <span className="material-symbols-outlined text-white text-3xl">favorite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">MHealth</h1>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-xl shadow-card dark:shadow-card-dark p-6 space-y-4">
          {done ? (
            <div className="text-center py-4">
              <span className="material-symbols-outlined text-emerald-500 filled mb-3 block" style={{ fontSize: 48 }}>check_circle</span>
              <p className="font-bold text-gray-900 dark:text-white text-lg">Password updated!</p>
              <p className="text-sm text-gray-500 mt-1">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-50 dark:bg-primary/20 mb-3">
                  <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">Set new password</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a strong password for your account.</p>
              </div>

              {!validSession ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-amber-800 font-medium">Invalid or expired reset link.</p>
                  <button onClick={() => navigate('/login')} className="text-sm text-primary font-semibold hover:underline mt-2 block mx-auto">
                    Request a new one
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="Min. 6 characters"
                        className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-gray-100 rounded px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-xl">{showPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-gray-100 rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                  <AppButton type="submit" loading={loading} className="w-full justify-center">
                    Update password
                  </AppButton>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
