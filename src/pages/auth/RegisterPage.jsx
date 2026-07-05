import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AppButton from '../../components/AppButton'

// Public sign-up is for patients only. Provider accounts are created by the
// hospital admin (Provider Management), so there is no role-selection step.
const STEPS = ['Account', 'Details']

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (step === 0) {
      if (!validateEmail(form.email)) {
        setError('Please enter a valid email address (e.g. you@example.com).')
        return
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      setError('')
      setStep(s => s + 1)
      return
    }
    setError('')
    setNotice('')
    setLoading(true)
    const { session, error: err } = await signUp(form.email, form.password, {
      name: form.name, phone: form.phone, role: 'patient',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    // No session means email confirmation is required — the user is NOT signed
    // in yet, so don't route into the app (which would show a stale session).
    if (!session) {
      setNotice('Account created! Please check your email to confirm your address, then sign in.')
      return
    }
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-pink mb-3">
            <span className="material-symbols-outlined text-white text-2xl">favorite</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Create Account</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= step ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {i < step ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-card-dark rounded-xl shadow-card dark:shadow-card-dark p-6 space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="you@example.com"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Minimum 8 characters"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Your full name"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone number</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+237 6XX XXX XXX"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          {notice && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">{notice}</p>
              <Link to="/login" className="text-sm text-primary font-semibold hover:underline">Go to sign in →</Link>
            </div>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <AppButton type="button" variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">
                Back
              </AppButton>
            )}
            <AppButton type="submit" loading={loading} className="flex-1 justify-center">
              {step < 1 ? 'Continue' : 'Create Account'}
            </AppButton>
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
