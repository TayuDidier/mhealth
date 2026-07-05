import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import AppCard from '../../components/AppCard'
import AppButton from '../../components/AppButton'
import StatusBadge from '../../components/StatusBadge'

export default function PatientManagement() {
  const { isDemoMode } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (isDemoMode) {
        const { SEED_PATIENTS } = await import('../../data/seedData')
        setPatients(SEED_PATIENTS.map(p => ({ ...p, status: 'active' })))
      } else {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, status, created_at')
          .eq('role', 'patient')
          .order('created_at', { ascending: false })
        setPatients(data || [])
      }
      setLoading(false)
    }
    load()
  }, [isDemoMode])

  async function updateStatus(patient, status) {
    if (!isDemoMode) {
      await supabase.from('users').update({ status }).eq('id', patient.id)
    }
    setPatients(prev => prev.map(p => p.id === patient.id ? { ...p, status } : p))
  }

  const filtered = patients.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Patient Management</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{patients.length} registered</span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <AppCard header={`${filtered.length} Patient${filtered.length !== 1 ? 's' : ''}`} className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No patients found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-3 text-left font-semibold">Patient</th>
                <th className="px-5 py-3 text-left font-semibold">Phone</th>
                <th className="px-5 py-3 text-left font-semibold">Joined</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-background-dark transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-pink flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                          : (p.name || 'P').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.phone || '—'}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={p.status || 'active'} /></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {p.status !== 'active' && (
                        <button onClick={() => updateStatus(p, 'active')}
                          className="text-xs text-teal-600 font-semibold hover:underline">Activate</button>
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
        )}
      </AppCard>
    </div>
  )
}
