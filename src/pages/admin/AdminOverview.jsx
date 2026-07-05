import { SEED_PATIENTS, SEED_PROVIDERS, SEED_APPOINTMENTS, SEED_EMERGENCY_ALERTS } from '../../data/seedData'
import AppCard from '../../components/AppCard'
import StatusBadge from '../../components/StatusBadge'
import { formatDate, timeAgo } from '../../utils/dateHelpers'

export default function AdminOverview() {
  const stats = [
    { icon: 'pregnant_woman', label: 'Total Patients', value: SEED_PATIENTS.length, color: 'text-primary bg-lavender-soft' },
    { icon: 'stethoscope', label: 'Active Providers', value: SEED_PROVIDERS.filter(p => p.status === 'active').length, color: 'text-teal-700 bg-mint' },
    { icon: 'calendar_month', label: 'Appointments This Month', value: SEED_APPOINTMENTS.length, color: 'text-blue-700 bg-blue-100' },
    { icon: 'sms', label: 'SMS Reminders Sent', value: SEED_APPOINTMENTS.filter(a => a.reminder_sent).length, color: 'text-orange-700 bg-orange-100' },
  ]

  const recentAppts = [...SEED_APPOINTMENTS].sort((a, b) => new Date(b.datetime) - new Date(a.datetime)).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <AppCard key={s.label} className="p-5">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-2xl">{s.icon}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </AppCard>
        ))}
      </div>

      {/* Recent Activity */}
      <AppCard header="Recent Appointments" className="overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {recentAppts.map(a => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{a.patient_name}</p>
                <p className="text-xs text-gray-500">{a.provider_name} · {formatDate(a.datetime)}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </AppCard>

      {/* Emergency Alerts */}
      {SEED_EMERGENCY_ALERTS.length > 0 && (
        <AppCard header={
          <span className="flex items-center gap-2 text-red-600">
            <span className="material-symbols-outlined text-xl">emergency</span>
            Emergency Alerts
            <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {SEED_EMERGENCY_ALERTS.length}
            </span>
          </span>
        } className="overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {SEED_EMERGENCY_ALERTS.map(a => (
              <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-red-600 text-lg">emergency</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{a.patient_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Notified:{' '}
                    {a.recipients.length > 0
                      ? a.recipients.map(r => `${r.name} (${r.phone})`).join(', ')
                      : 'No contact on file'}
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{timeAgo(a.triggered_at)}</p>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* Registration Trend (simple visual) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AppCard header="Patients by Provider" className="p-5">
          <div className="space-y-3">
            {SEED_PROVIDERS.map(p => {
              const count = SEED_PATIENTS.filter(pt => pt.assigned_provider_id === p.id).length
              const pct = Math.round((count / SEED_PATIENTS.length) * 100)
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                    <span className="text-gray-500">{count} patients</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-background-dark rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </AppCard>

        <AppCard header="Appointment Status Split" className="p-5">
          <div className="space-y-3">
            {['upcoming', 'completed', 'cancelled'].map(status => {
              const count = SEED_APPOINTMENTS.filter(a => a.status === status).length
              const pct = Math.round((count / SEED_APPOINTMENTS.length) * 100)
              const colors = { upcoming: 'bg-primary', completed: 'bg-teal-500', cancelled: 'bg-gray-400' }
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-background-dark rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </AppCard>
      </div>
    </div>
  )
}
