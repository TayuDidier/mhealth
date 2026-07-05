const STATUS_STYLES = {
  upcoming:    'bg-pink-100 text-primary',
  completed:   'bg-mint text-teal-700',
  cancelled:   'bg-gray-100 text-gray-500',
  pending:     'bg-yellow-100 text-yellow-700',
  active:      'bg-mint text-teal-700',
  inactive:    'bg-gray-100 text-gray-500',
  deactivated: 'bg-red-100 text-red-600',
}

export default function StatusBadge({ status }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : ''
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {label}
    </span>
  )
}
