import StatusBadge from './StatusBadge'
import { formatDate, formatTime, daysUntil } from '../utils/dateHelpers'

export default function AppointmentCard({ appointment, showPatient = false, onAction }) {
  const countdown = daysUntil(appointment.datetime)
  return (
    <div className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-card dark:shadow-card-dark border border-gray-50 dark:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {showPatient ? (
            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{appointment.patient_name}</p>
          ) : (
            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{appointment.provider_name}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            <span className="material-symbols-outlined text-base align-middle mr-1">calendar_today</span>
            {formatDate(appointment.datetime)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined text-base align-middle mr-1">schedule</span>
            {formatTime(appointment.datetime)}
          </p>
          {appointment.location && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-base align-middle mr-1">location_on</span>
              {appointment.location}
            </p>
          )}
          {appointment.status === 'upcoming' && countdown !== null && countdown >= 0 && (
            <p className="text-xs text-primary font-medium mt-1">
              {countdown === 0 ? 'Today!' : countdown === 1 ? 'Tomorrow' : `In ${countdown} days`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={appointment.status} />
          {onAction && appointment.status === 'upcoming' && (
            <button
              onClick={() => onAction(appointment)}
              className="text-xs text-primary font-medium hover:underline"
            >
              Manage
            </button>
          )}
        </div>
      </div>
      {appointment.notes ? (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-background-dark rounded-lg px-3 py-2">
          {appointment.notes}
        </p>
      ) : null}
    </div>
  )
}
