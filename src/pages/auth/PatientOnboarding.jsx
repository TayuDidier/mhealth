import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_PROVIDERS } from '../../data/seedData'
import AppButton from '../../components/AppButton'

const STEPS = ['Pregnancy', 'Due Date', 'Provider', 'Emergency Contact']

export default function PatientOnboarding() {
  const { user, updateProfile, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    gestational_week: 12,
    due_date: '',
    assigned_provider_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function finish() {
    setLoading(true)
    if (isDemoMode) {
      await updateProfile({
        gestational_week: form.gestational_week,
        due_date: form.due_date,
        assigned_provider_id: form.assigned_provider_id,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        onboarding_complete: true,
      })
    } else {
      await supabase.from('patient_profiles').upsert({
        user_id: user.id,
        gestational_week: form.gestational_week,
        due_date: form.due_date || null,
        assigned_provider_id: form.assigned_provider_id || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        onboarding_complete: true,
      }, { onConflict: 'user_id' })
    }
    setLoading(false)
    navigate('/patient')
  }

  async function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else await finish()
  }

  const [providers, setProviders] = useState(isDemoMode ? SEED_PROVIDERS : [])

  useEffect(() => {
    if (isDemoMode) return
    async function fetchProviders() {
      const { data: users } = await supabase
        .from('users').select('id, name').eq('role', 'provider')
      if (!users?.length) return
      const { data: details } = await supabase
        .from('providers').select('user_id, specialty, clinic_name')
        .in('user_id', users.map(u => u.id))
      setProviders(users.map(u => ({
        id: u.id,
        name: u.name,
        specialty: details?.find(d => d.user_id === u.id)?.specialty || '',
        clinic_name: details?.find(d => d.user_id === u.id)?.clinic_name || '',
      })))
    }
    fetchProviders()
  }, [isDemoMode])

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌸</div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Welcome!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Let's set up your pregnancy profile</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : i < step ? 'w-2 bg-primary/50' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        <div className="bg-white dark:bg-card-dark rounded-xl shadow-card dark:shadow-card-dark p-6">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5">{STEPS[step]}</h2>

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">How many weeks pregnant are you?</p>
              <input
                type="number" min={1} max={42} value={form.gestational_week}
                onChange={e => set('gestational_week', Number(e.target.value))}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="range" min={1} max={42} value={form.gestational_week}
                onChange={e => set('gestational_week', Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-center text-sm text-gray-500">
                {form.gestational_week <= 13 ? '1st Trimester' : form.gestational_week <= 26 ? '2nd Trimester' : '3rd Trimester'}
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">What is your expected due date?</p>
              <input
                type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Select your healthcare provider</p>
              {providers.map(p => (
                <button type="button" key={p.id}
                  onClick={() => set('assigned_provider_id', p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${form.assigned_provider_id === p.id ? 'border-primary bg-lavender-soft dark:bg-primary/20' : 'border-gray-200 dark:border-gray-600'}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.specialty} · {p.clinic_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
                <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">emergency</span>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Add someone we can notify if you trigger an emergency alert — a partner, family member, or trusted friend.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contact Name</label>
                <input
                  type="text" value={form.emergency_contact_name}
                  onChange={e => set('emergency_contact_name', e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                <input
                  type="tel" value={form.emergency_contact_phone}
                  onChange={e => set('emergency_contact_phone', e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <AppButton variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">Back</AppButton>
            )}
            <AppButton onClick={next} loading={loading} className="flex-1 justify-center">
              {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
            </AppButton>
          </div>

          {step < STEPS.length - 1 && (
            <button onClick={() => setStep(s => s + 1)} className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600">
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
