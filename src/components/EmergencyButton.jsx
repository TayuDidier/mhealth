import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SEED_PATIENTS } from '../data/seedData'

export const NATIONAL_EMERGENCY = '199'

export default function EmergencyButton() {
  const { profile, isDemoMode } = useAuth()
  const [phase, setPhase] = useState('idle') // idle | confirm

  const patientData = isDemoMode
    ? SEED_PATIENTS.find(p => p.email === profile?.email) || SEED_PATIENTS[0]
    : profile

  const contactName  = patientData?.emergency_contact_name
  const contactPhone = patientData?.emergency_contact_phone
  const hasContact   = contactName && contactPhone

  const dialNumber = hasContact ? contactPhone : NATIONAL_EMERGENCY
  const dialLabel  = hasContact ? `${contactName} (${contactPhone})` : `Emergency services (${NATIONAL_EMERGENCY})`

  function call() {
    window.location.href = `tel:${dialNumber}`
    setPhase('idle')
  }

  if (phase === 'confirm') {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-400 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
          <p className="font-bold text-red-700 dark:text-red-300 text-sm">Call for emergency help?</p>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400">
          This will open your phone app to call <strong>{dialLabel}</strong>.
        </p>
        <div className="flex gap-2">
          <button
            onClick={call}
            className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-bold py-2.5 rounded-lg transition-all"
          >
            Yes, call now
          </button>
          <button
            onClick={() => setPhase('idle')}
            className="flex-1 bg-gray-100 dark:bg-card-dark text-gray-700 dark:text-gray-300 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setPhase('confirm')}
      className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-xl py-4 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all"
    >
      <span className="material-symbols-outlined text-2xl">emergency</span>
      <span className="text-base">Emergency Alert</span>
    </button>
  )
}
