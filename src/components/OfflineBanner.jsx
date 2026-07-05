import { useNetwork } from '../hooks/useNetwork'

export default function OfflineBanner() {
  const online = useNetwork()
  if (online) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white text-center py-2 text-xs font-semibold">
      <span className="material-symbols-outlined text-sm align-middle mr-1">wifi_off</span>
      You're offline. Some features require an internet connection.
    </div>
  )
}
