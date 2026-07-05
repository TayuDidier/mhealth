export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-card animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mb-3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-2 ${i === lines - 2 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}
