import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AppButton from '../../components/AppButton'

export default function LoginPage() {
  const { signIn, sendPasswordReset, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState('login') // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { user, error: err } = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    const role = user?.role
    if (role === 'admin') navigate('/admin')
    else if (role === 'provider') navigate('/provider')
    else navigate('/patient')
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await sendPasswordReset(email)
    setLoading(false)
    if (err) { setError(err.message); return }
    setResetSent(true)
  }

  function quickLogin(demoEmail) {
    setEmail(demoEmail)
    setPassword('demo123')
  }

  function switchView(v) {
    setView(v)
    setError('')
    setResetSent(false)
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-pink mb-4">
            <span className="material-symbols-outlined text-white text-3xl">favorite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">MHealth</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Antenatal Care Support</p>
        </div>

        {isDemoMode && view === 'login' && (
          <div className="bg-lavender-soft dark:bg-card-dark rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">Demo Mode — Quick Access</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Patient', email: 'patient@demo.com' },
                { label: 'Provider', email: 'provider@demo.com' },
                { label: 'Admin', email: 'admin@demo.com' },
              ].map(d => (
                <button key={d.email} onClick={() => quickLogin(d.email)}
                  className="text-xs bg-white dark:bg-background-dark text-primary font-semibold px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary hover:text-white transition-colors">
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Login form */}
        {view === 'login' && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-card-dark rounded-xl shadow-card dark:shadow-card-dark p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-gray-100 rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <button type="button" onClick={() => switchView('forgot')}
                  className="text-xs text-primary font-semibold hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Your password"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-gray-100 rounded px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined text-xl">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <AppButton type="submit" loading={loading} className="w-full justify-center">
              Sign In
            </AppButton>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link>
            </p>
          </form>
        )}

        {/* Forgot password form */}
        {view === 'forgot' && (
          <div className="bg-white dark:bg-card-dark rounded-xl shadow-card dark:shadow-card-dark p-6 space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-50 dark:bg-primary/20 mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Reset your password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {resetSent ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 text-center">
                <span className="material-symbols-outlined text-emerald-600 text-3xl filled mb-2 block">mark_email_read</span>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Check your inbox</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  A reset link has been sent to <strong>{email}</strong>
                </p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-gray-100 rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                <AppButton type="submit" loading={loading} className="w-full justify-center">
                  Send reset link
                </AppButton>
              </form>
            )}

            <button onClick={() => switchView('login')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mx-auto">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
