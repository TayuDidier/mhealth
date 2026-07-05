export default function AppCard({ children, rounded = 'xl', className = '', header, ...props }) {
  const radii = { lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full', default: 'rounded' }
  return (
    <div
      className={`bg-white dark:bg-card-dark shadow-card dark:shadow-card-dark ${radii[rounded] ?? 'rounded-xl'} overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200">
          {header}
        </div>
      )}
      {children}
    </div>
  )
}
