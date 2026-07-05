import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, backButton = false, action }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 h-14">
      <div className="flex items-center gap-2">
        {backButton && (
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-card-dark transition-colors">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
          </button>
        )}
        <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}
