export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
      <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
      <div className="flex-1">
        <p className="text-sm text-red-700 dark:text-red-300 font-medium">{message || 'Something went wrong.'}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs font-semibold text-primary underline">
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
