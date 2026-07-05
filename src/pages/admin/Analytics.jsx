import { SEED_PATIENTS, SEED_PROVIDERS, SEED_APPOINTMENTS } from '../../data/seedData'
import AppCard from '../../components/AppCard'

function StatRow({ label, value, max, color = 'bg-primary' }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-bold text-gray-800 dark:text-gray-100">{value}</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-background-dark rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Analytics() {
  const completed = SEED_APPOINTMENTS.filter(a => a.status === 'completed').length
  const total = SEED_APPOINTMENTS.length
  const adherenceRate = total ? Math.round((completed / total) * 100) : 0
  const smsDelivered = SEED_APPOINTMENTS.filter(a => a.reminder_sent).length

  const trimesterDist = SEED_PATIENTS.reduce((acc, p) => {
    const t = p.gestational_week <= 13 ? '1st' : p.gestational_week <= 26 ? '2nd' : '3rd'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Analytics</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'trending_up', label: 'Adherence Rate', value: `${adherenceRate}%`, color: 'text-teal-700 bg-mint' },
          { icon: 'sms', label: 'SMS Delivered', value: smsDelivered, color: 'text-blue-700 bg-blue-100' },
          { icon: 'pregnant_woman', label: 'Active Patients', value: SEED_PATIENTS.length, color: 'text-primary bg-lavender-soft' },
          { icon: 'stethoscope', label: 'Providers', value: SEED_PROVIDERS.length, color: 'text-orange-700 bg-orange-100' },
        ].map(s => (
          <AppCard key={s.label} className="p-4 text-center">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
              <span className="material-symbols-outlined text-2xl">{s.icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </AppCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appointment Adherence */}
        <AppCard header="Appointment Outcomes" className="p-5">
          <div className="space-y-4">
            <StatRow label="Completed" value={completed} max={total} color="bg-teal-500" />
            <StatRow label="Upcoming" value={SEED_APPOINTMENTS.filter(a => a.status === 'upcoming').length} max={total} color="bg-primary" />
            <StatRow label="Cancelled" value={SEED_APPOINTMENTS.filter(a => a.status === 'cancelled').length} max={total} color="bg-gray-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Overall adherence rate: <strong className="text-gray-800 dark:text-gray-100">{adherenceRate}%</strong></p>
        </AppCard>

        {/* Patient Trimester Distribution */}
        <AppCard header="Patients by Trimester" className="p-5">
          <div className="space-y-4">
            {Object.entries(trimesterDist).map(([t, count]) => (
              <StatRow key={t} label={`${t} Trimester`} value={count} max={SEED_PATIENTS.length}
                color={t === '1st' ? 'bg-pink-500' : t === '2nd' ? 'bg-teal-500' : 'bg-orange-500'} />
            ))}
          </div>
        </AppCard>

        {/* SMS Delivery */}
        <AppCard header="SMS Reminder Stats" className="p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total reminders sent</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{smsDelivered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending appointments</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">
                {SEED_APPOINTMENTS.filter(a => a.status === 'upcoming' && !a.reminder_sent).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Delivery rate</span>
              <span className="font-bold text-teal-600">
                {total ? Math.round((smsDelivered / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </AppCard>

        {/* Provider Performance */}
        <AppCard header="Provider Workload" className="p-5">
          <div className="space-y-4">
            {SEED_PROVIDERS.map(p => {
              const count = SEED_APPOINTMENTS.filter(a => a.provider_id === p.id).length
              return (
                <StatRow key={p.id} label={p.name} value={count} max={SEED_APPOINTMENTS.length} />
              )
            })}
          </div>
        </AppCard>
      </div>
    </div>
  )
}
