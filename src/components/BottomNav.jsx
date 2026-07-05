import { NavLink } from 'react-router-dom'

export default function BottomNav({ items }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-card-dark border-t border-gray-100 dark:border-gray-700 flex justify-around items-center h-16 px-2 max-w-md mx-auto">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 min-w-[52px] py-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined text-2xl ${isActive ? 'filled' : ''}`}>{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
