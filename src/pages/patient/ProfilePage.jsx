import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../supabaseClient'
import { SEED_PATIENTS } from '../../data/seedData'
import { trimesterLabel } from '../../utils/trimester'
import { NATIONAL_EMERGENCY } from '../../components/EmergencyButton'
import PageHeader from '../../components/PageHeader'
import AppButton from '../../components/AppButton'
import AppCard from '../../components/AppCard'

export default function ProfilePage() {
  const { user, profile, signOut, updateProfile, isDemoMode } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: profile?.name || '', phone: profile?.phone || '' })
  const [saving, setSaving] = useState(false)
  const [editingContact, setEditingContact] = useState(false)
  const [contactForm, setContactForm] = useState({
    emergency_contact_name:  profile?.emergency_contact_name  || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
  })
  const [savingContact, setSavingContact] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)
  const [providers, setProviders] = useState([])
  const [assignedProvider, setAssignedProvider] = useState(null)
  const [changingProvider, setChangingProvider] = useState(false)
  const [savingProvider, setSavingProvider] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState('')

  const patientData = isDemoMode ? SEED_PATIENTS.find(p => p.email === profile?.email) || SEED_PATIENTS[0] : profile

  useEffect(() => {
    if (isDemoMode) {
      import('../../data/seedData').then(({ SEED_PROVIDERS }) => {
        setProviders(SEED_PROVIDERS)
        const assigned = SEED_PROVIDERS.find(p => p.id === patientData?.assigned_provider_id)
        setAssignedProvider(assigned || null)
        setSelectedProviderId(assigned?.id || '')
      })
      return
    }
    async function loadProviderData() {
      const [{ data: ppData }, { data: provUsers }] = await Promise.all([
        supabase.from('patient_profiles').select('assigned_provider_id').eq('user_id', profile.id).single(),
        supabase.from('users').select('id, name').eq('role', 'provider'),
      ])
      const providerIds = (provUsers || []).map(u => u.id)
      const { data: provDetails } = providerIds.length
        ? await supabase.from('providers').select('user_id, specialty, clinic_name').in('user_id', providerIds)
        : { data: [] }
      const list = (provUsers || []).map(u => ({
        id: u.id,
        name: u.name,
        specialty: provDetails?.find(d => d.user_id === u.id)?.specialty || '',
        clinic_name: provDetails?.find(d => d.user_id === u.id)?.clinic_name || '',
      }))
      setProviders(list)
      const current = list.find(p => p.id === ppData?.assigned_provider_id) || null
      setAssignedProvider(current)
      setSelectedProviderId(ppData?.assigned_provider_id || '')
    }
    if (profile?.id) loadProviderData()
  }, [profile?.id, isDemoMode])
  const initials = (profile?.name || 'P').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

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

  async function save() {
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setEditing(false)
  }

  async function saveContact() {
    setSavingContact(true)
    await updateProfile(contactForm)
    setSavingContact(false)
    setEditingContact(false)
  }

  async function saveProvider() {
    if (!selectedProviderId) return
    setSavingProvider(true)
    if (!isDemoMode) {
      await supabase.from('patient_profiles').update({ assigned_provider_id: selectedProviderId }).eq('user_id', profile.id)
    }
    const found = providers.find(p => p.id === selectedProviderId) || null
    setAssignedProvider(found)
    setChangingProvider(false)
    setSavingProvider(false)
  }

  async function logout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div>
      <PageHeader title="My Profile" />
      <div className="px-4 pt-5 pb-8 space-y-5">
        {/* Avatar */}
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
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
          </div>
        </div>

        {/* Pregnancy Info */}
        {patientData?.gestational_week && (
          <AppCard className="p-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Pregnancy</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-lavender-soft dark:bg-primary/20 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Week</p>
                <p className="font-bold text-primary">{patientData.gestational_week}</p>
              </div>
              <div className="bg-mint rounded-lg p-3">
                <p className="text-xs text-gray-500">Trimester</p>
                <p className="font-bold text-teal-700 text-xs">{trimesterLabel(patientData.gestational_week)}</p>
              </div>
              {patientData.due_date && (
                <div className="col-span-2 bg-gray-50 dark:bg-background-dark rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Expected Due Date</p>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{patientData.due_date}</p>
                </div>
              )}
            </div>
          </AppCard>
        )}

        {/* Edit Profile */}
        <AppCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Personal Info</h3>
            {!editing && <button onClick={() => setEditing(true)} className="text-xs text-primary font-semibold hover:underline">Edit</button>}
          </div>
          {editing ? (
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="flex gap-2">
                <AppButton variant="ghost" onClick={() => setEditing(false)} className="flex-1">Cancel</AppButton>
                <AppButton onClick={save} loading={saving} className="flex-1 justify-center">Save</AppButton>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { icon: 'person', label: 'Name', val: profile?.name },
                { icon: 'phone', label: 'Phone', val: profile?.phone },
                { icon: 'mail', label: 'Email', val: profile?.email },
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

        {/* Assigned Provider */}
        <AppCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">My Provider</h3>
            {!changingProvider && (
              <button onClick={() => setChangingProvider(true)} className="text-xs text-primary font-semibold hover:underline">Change</button>
            )}
          </div>
          {changingProvider ? (
            <div className="space-y-3">
              {providers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">No providers available.</p>
              ) : (
                providers.map(p => (
                  <button type="button" key={p.id} onClick={() => setSelectedProviderId(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedProviderId === p.id ? 'border-primary bg-lavender-soft dark:bg-primary/20' : 'border-gray-200 dark:border-gray-600'}`}>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.specialty}{p.clinic_name ? ` · ${p.clinic_name}` : ''}</p>
                    </div>
                    {selectedProviderId === p.id && (
                      <span className="material-symbols-outlined text-primary ml-auto">check_circle</span>
                    )}
                  </button>
                ))
              )}
              <div className="flex gap-2 pt-1">
                <AppButton variant="ghost" onClick={() => setChangingProvider(false)} className="flex-1">Cancel</AppButton>
                <AppButton onClick={saveProvider} loading={savingProvider} disabled={!selectedProviderId} className="flex-1 justify-center">Save</AppButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400 text-xl">stethoscope</span>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {assignedProvider ? assignedProvider.name : '—'}
                </p>
                {assignedProvider?.specialty && (
                  <p className="text-xs text-gray-400">{assignedProvider.specialty}{assignedProvider.clinic_name ? ` · ${assignedProvider.clinic_name}` : ''}</p>
                )}
              </div>
            </div>
          )}
        </AppCard>

        {/* Emergency Contact */}
        <AppCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Emergency Contact</h3>
            {!editingContact && (
              <button onClick={() => setEditingContact(true)} className="text-xs text-primary font-semibold hover:underline">
                Edit
              </button>
            )}
          </div>
          {editingContact ? (
            <div className="space-y-3">
              <input
                value={contactForm.emergency_contact_name}
                onChange={e => setContactForm(f => ({ ...f, emergency_contact_name: e.target.value }))}
                placeholder="Contact name"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                value={contactForm.emergency_contact_phone}
                onChange={e => setContactForm(f => ({ ...f, emergency_contact_phone: e.target.value }))}
                placeholder="Phone number"
                type="tel"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-2">
                <AppButton variant="ghost" onClick={() => setEditingContact(false)} className="flex-1">Cancel</AppButton>
                <AppButton onClick={saveContact} loading={savingContact} className="flex-1 justify-center">Save</AppButton>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { icon: 'person_alert', label: 'Name',  val: profile?.emergency_contact_name },
                { icon: 'phone',        label: 'Phone', val: profile?.emergency_contact_phone },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400 text-xl">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.val || '—'}</p>
                  </div>
                </div>
              ))}
              {!profile?.emergency_contact_name && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  No emergency contact saved — the Emergency Alert will dial {NATIONAL_EMERGENCY} instead.
                </p>
              )}
            </div>
          )}
        </AppCard>

        {/* Settings */}
        <AppCard className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-500 text-xl">dark_mode</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
            </div>
            <button onClick={toggle}
              className={`w-11 h-6 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-gray-300'} relative`}>
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
