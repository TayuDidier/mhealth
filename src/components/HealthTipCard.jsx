export default function HealthTipCard({ tip, trimester }) {
  const colors = { 1: 'from-pink-400 to-purple-500', 2: 'from-teal-400 to-cyan-500', 3: 'from-orange-400 to-pink-500' }
  const gradient = colors[trimester] ?? 'from-primary to-purple-500'
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-xl p-4 text-white`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-xl">lightbulb</span>
        <span className="text-xs font-semibold uppercase tracking-wide opacity-90">Weekly Tip · Trimester {trimester}</span>
      </div>
      <p className="text-sm font-medium leading-relaxed">{tip}</p>
    </div>
  )
}
