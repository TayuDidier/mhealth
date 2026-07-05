import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../supabaseClient'
import { SEED_PROVIDERS } from '../../data/seedData'
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

  const providerData = isDemoMode ? SEED_PROVIDERS.find(p => p.email === profile?.email) || SEED_PROVIDERS[0] : profile
  const initials = (profile?.name || 'DR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

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
            <p className="text-sm text-gray-500 dark:text-gray-400">{providerData?.specialty}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{providerData?.clinic_name}</p>
          </div>
        </div>

        <AppCard className="p-4 space-y-3">
          {[
            { icon: 'person', label: 'Name', val: profile?.name },
            { icon: 'mail', label: 'Email', val: profile?.email },
            { icon: 'phone', label: 'Phone', val: profile?.phone || providerData?.phone },
            { icon: 'stethoscope', label: 'Specialty', val: providerData?.specialty },
            { icon: 'local_hospital', label: 'Clinic', val: providerData?.clinic_name },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400 text-xl">{item.icon}</span>
              <div>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.val || '—'}</p>
              </div>
            </div>
          ))}
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
