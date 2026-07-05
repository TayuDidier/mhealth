import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../supabaseClient'
import { SEED_PROVIDERS } from '../../data/seedData'
import { HOSPITAL } from '../../config/hospital'
import PageHeader from '../../components/PageHeader'
import AppCard from '../../components/AppCard'
import AppButton from '../../components/AppButton'

export default function ProviderProfile() {
  const { user, profile, signOut, updateProfile, isDemoMode } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  // Specialty lives in the `providers` table, which fetchProfile does not load —
  // keep it in local state, sourced from the DB (or seed in demo mode). Clinic is
  // no longer per-provider: every provider is affiliated with the one hospital.
  const [providerInfo, setProviderInfo] = useState({ specialty: '' })
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const initials = (profile?.name || 'DR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (isDemoMode) {
      const seed = SEED_PROVIDERS.find(p => p.email === profile?.email) || SEED_PROVIDERS[0]
      setProviderInfo({ specialty: profile?.specialty ?? seed?.specialty ?? '' })
      return
    }
    if (!profile?.id) return
    supabase.from('providers').select('specialty').eq('user_id', profile.id).single()
      .then(({ data }) => {
        if (data) setProviderInfo({ specialty: data.specialty || '' })
      })
  }, [profile?.id, profile?.email, profile?.specialty, isDemoMode])

  function startEdit() {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      specialty: providerInfo.specialty || '',
    })
    setSaveError('')
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    setSaveError('')
    // Name / phone belong to the users table (handled by updateProfile).
    const { error: profErr } = await updateProfile({ name: form.name, phone: form.phone })
    // Specialty belongs to the providers table.
    let provErr = null
    if (isDemoMode) {
      await updateProfile({ specialty: form.specialty })
    } else {
      const { error } = await supabase.from('providers').upsert(
        { user_id: profile.id, specialty: form.specialty },
        { onConflict: 'user_id' },
      )
      provErr = error
    }
    setSaving(false)
    if (profErr || provErr) {
      setSaveError((profErr || provErr).message || 'Could not save profile. Please try again.')
      return
    }
    setProviderInfo({ specialty: form.specialty })
    setEditing(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')

    const preview = URL.createObjectURL(file)
    setAvatarUrl(preview)

    if (isDemoMode) return

    const userId = profile?.id || user?.id
    if (!userId) { setUploadError('Not authenticated. Please sign in again.'); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateProfile({ avatar_url: publicUrl })
      setAvatarUrl(publicUrl)
    } catch (err) {
      setUploadError(err?.message || 'Photo upload failed. Please try again.')
      setAvatarUrl(profile?.avatar_url || null)
    }
    setUploading(false)
  }

  async function logout() { await signOut(); navigate('/login') }

  return (
    <div>
      <PageHeader title="My Profile" />
      <div className="px-4 pt-5 pb-8 space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full gradient-pink flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                : initials}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-pink border-2 border-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            >
              {uploading
                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>photo_camera</span>}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          {uploadError && <p className="text-xs text-red-500 text-center max-w-xs">{uploadError}</p>}
          <div className="text-center">
            <p className="font-bold text-xl text-gray-900 dark:text-white">{profile?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{providerInfo.specialty}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{HOSPITAL.name}</p>
          </div>
        </div>

        <AppCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Profile Details</h3>
            {!editing && (
              <button onClick={startEdit} className="text-xs text-primary font-semibold hover:underline">
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'tel' },
                { key: 'specialty', label: 'Specialty', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                  <input
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    type={f.type}
                    placeholder={f.label}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              {saveError && <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>}
              <div className="flex gap-2">
                <AppButton variant="ghost" onClick={() => { setEditing(false); setSaveError('') }} className="flex-1">Cancel</AppButton>
                <AppButton onClick={save} loading={saving} className="flex-1 justify-center">Save</AppButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: 'person', label: 'Name', val: profile?.name },
                { icon: 'mail', label: 'Email', val: profile?.email },
                { icon: 'phone', label: 'Phone', val: profile?.phone },
                { icon: 'stethoscope', label: 'Specialty', val: providerInfo.specialty },
                { icon: 'local_hospital', label: 'Hospital', val: HOSPITAL.name },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400 text-xl">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.val || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCard>

        <AppCard className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-500 text-xl">dark_mode</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
            </div>
            <button onClick={toggle} className={`w-11 h-6 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-gray-300'} relative`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </AppCard>

        <AppButton variant="danger" className="w-full justify-center" onClick={logout}>
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign Out
        </AppButton>
      </div>
    </div>
  )
}
