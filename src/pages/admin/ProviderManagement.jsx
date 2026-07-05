import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { SEED_PROVIDERS } from '../../data/seedData'
import { useAuth } from '../../contexts/AuthContext'
import AppCard from '../../components/AppCard'
import AppButton from '../../components/AppButton'
import StatusBadge from '../../components/StatusBadge'

const EMPTY_ADD = { name: '', email: '', specialty: '', phone: '', password: '' }

export default function ProviderManagement() {
  const { isDemoMode } = useAuth()
  const [providers, setProviders] = useState(isDemoMode ? SEED_PROVIDERS : [])
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_ADD)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    if (!isDemoMode) loadProviders()
  }, [isDemoMode])

  async function loadProviders() {
    const { data: users } = await supabase.from('users').select('id, name, email, phone').eq('role', 'provider')
    if (!users) return
    const { data: details } = users.length
      ? await supabase.from('providers').select('user_id, specialty, status').in('user_id', users.map(u => u.id))
      : { data: [] }
    setProviders(users.map(u => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      specialty: details?.find(d => d.user_id === u.id)?.specialty || '',
      status: details?.find(d => d.user_id === u.id)?.status || 'pending',
    })))
  }

  async function updateStatus(prov, status) {
    if (!isDemoMode) await supabase.from('providers').upsert({ user_id: prov.id, status }, { onConflict: 'user_id' })
    setProviders(prev => prev.map(p => p.id === prov.id ? { ...p, status } : p))
  }

  async function addProvider(e) {
    e.preventDefault()
    setSaving(true)
    setAddError('')
    if (isDemoMode) {
      setProviders(prev => [...prev, { id: `prov-${Date.now()}`, ...addForm, status: 'active', role: 'provider' }])
      setShowAdd(false); setAddForm(EMPTY_ADD); setSaving(false)
      return
    }
    // Creating a login account requires elevated privileges, so it runs in a
    // server-side Edge Function that verifies the caller is an admin.
    const { data, error } = await supabase.functions.invoke('admin-create-provider', {
      body: {
        name: addForm.name, email: addForm.email, phone: addForm.phone,
        specialty: addForm.specialty, password: addForm.password,
      },
    })
    setSaving(false)
    if (error || data?.error) {
      setAddError(data?.error || error?.message || 'Could not create provider. Please try again.')
      return
    }
    setProviders(prev => [...prev, data])
    setShowAdd(false); setAddForm(EMPTY_ADD)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Provider Management</h1>
        <AppButton onClick={() => setShowAdd(v => !v)}>
          <span className="material-symbols-outlined text-sm">add</span>
          Add Provider
        </AppButton>
      </div>

      {showAdd && (
        <AppCard className="p-5">
          <h2 className="font-bold text-gray-800 dark:text-white mb-4">Add New Provider</h2>
          <form onSubmit={addProvider} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text', required: true },
              { key: 'email', label: 'Email', type: 'email', required: true },
              { key: 'specialty', label: 'Specialty', type: 'text' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'password', label: 'Temporary Password', type: 'password', required: true },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                <input type={f.type} required={f.required} value={addForm[f.key]} onChange={e => setAddForm(form => ({ ...form, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            ))}
            <p className="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
              The provider signs in with this email and temporary password, then can change it later.
            </p>
            {addError && <p className="sm:col-span-2 text-sm text-red-600 dark:text-red-400">{addError}</p>}
            <div className="sm:col-span-2 flex gap-3">
              <AppButton type="submit" loading={saving}>Save Provider</AppButton>
              <AppButton type="button" variant="ghost" onClick={() => { setShowAdd(false); setAddError('') }}>Cancel</AppButton>
            </div>
          </form>
        </AppCard>
      )}

      {/* Provider Table */}
      <AppCard header={`${providers.length} Providers`} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="px-5 py-3 text-left font-semibold">Provider</th>
              <th className="px-5 py-3 text-left font-semibold">Specialty</th>
              <th className="px-5 py-3 text-left font-semibold">Status</th>
              <th className="px-5 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {providers.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-background-dark transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-pink flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.specialty}</td>
                <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    {p.status !== 'active' && (
                      <button onClick={() => updateStatus(p, 'active')}
                        className="text-xs text-teal-600 font-semibold hover:underline">Approve</button>
                    )}
                    {p.status !== 'deactivated' && (
                      <button onClick={() => updateStatus(p, 'deactivated')}
                        className="text-xs text-red-500 font-semibold hover:underline">Deactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppCard>
    </div>
  )
}
