import AppButton from './AppButton'

export default function EmptyState({ icon = 'inbox', title, message, cta, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-lavender-soft dark:bg-card-dark flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
      </div>
      <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg mb-2">{title}</h3>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>}
      {cta && onCta && (
        <div className="mt-5">
          <AppButton onClick={onCta}>{cta}</AppButton>
        </div>
      )}
    </div>
  )
}
