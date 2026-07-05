import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_PATIENTS } from '../../data/seedData'
import { trimesterLabel } from '../../utils/trimester'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

export default function PatientManagement() {
  const { profile, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState(() =>
    isDemoMode
      ? SEED_PATIENTS.filter(p => p.assigned_provider_id === (profile?.id || 'provider-1'))
      : []
  )

  useEffect(() => {
    if (isDemoMode || !profile) return
    async function load() {
      const { data: profiles } = await supabase
        .from('patient_profiles')
        .select('user_id, gestational_week')
        .eq('assigned_provider_id', profile.id)
      if (!profiles?.length) return
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', profiles.map(p => p.user_id))
      setPatients(
        (users || []).map(u => ({
          ...u,
          gestational_week: profiles.find(p => p.user_id === u.id)?.gestational_week ?? null,
        }))
      )
    }
    load()
  }, [profile, isDemoMode])

  const filtered = patients.filter(p =>
    search === '' || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="My Patients" />
      <div className="px-4 pt-4 space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
            className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-600 dark:text-white rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="group" title="No patients found" message="Your assigned patients will appear here." />
        ) : (
          <div className="space-y-3 pb-4">
            {filtered.map(p => (
              <button key={p.id} onClick={() => navigate(`/provider/patients/${p.id}`)}
                className="w-full text-left bg-white dark:bg-card-dark rounded-xl p-4 shadow-card dark:shadow-card-dark hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-pink flex items-center justify-center text-white font-bold">
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {p.gestational_week ? `Week ${p.gestational_week} · ${trimesterLabel(p.gestational_week)}` : 'No gestational data'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
