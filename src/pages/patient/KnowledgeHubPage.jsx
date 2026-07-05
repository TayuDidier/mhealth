import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_HEALTH_CONTENT } from '../../data/seedData'
import PageHeader from '../../components/PageHeader'
import SkeletonCard from '../../components/SkeletonCard'
import EmptyState from '../../components/EmptyState'

const TABS = [
  { key: '1', label: '1st' },
  { key: '2', label: '2nd' },
  { key: '3', label: '3rd' },
  { key: 'general', label: 'General' },
]

const CACHED_KEY = 'mhealth-cached-articles'

export default function KnowledgeHubPage() {
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('general')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cachedIds, setCachedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHED_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => {
    setLoading(true)
    if (isDemoMode) {
      setArticles(SEED_HEALTH_CONTENT)
      setCachedIds(SEED_HEALTH_CONTENT.map(a => a.id))
      setLoading(false)
      return
    }
    supabase.from('health_content').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setArticles(data)
          const ids = data.map(a => a.id)
          localStorage.setItem(CACHED_KEY, JSON.stringify(ids))
          setCachedIds(ids)
        }
        setLoading(false)
      })
  }, [isDemoMode])

  const filtered = articles.filter(a =>
    (tab === 'all' || a.trimester === tab) &&
    (search === '' || a.title.toLowerCase().includes(search.toLowerCase()))
  )

  const trimesterColor = { '1': 'bg-pink-100 text-pink-700', '2': 'bg-teal-100 text-teal-700', '3': 'bg-orange-100 text-orange-700', 'general': 'bg-lavender-soft text-purple-700' }

  return (
    <div>
      <PageHeader title="Knowledge Hub" />

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
            className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-600 dark:text-white rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${tab === t.key ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-card-dark text-gray-500 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 space-y-4">
        {loading ? <><SkeletonCard lines={3} /><SkeletonCard lines={3} /></>
          : filtered.length === 0 ? <EmptyState icon="menu_book" title="No articles found" message="Try a different search or trimester tab." />
          : filtered.map(article => (
            <button key={article.id} onClick={() => navigate(`/patient/hub/${article.id}`)}
              className="w-full text-left bg-white dark:bg-card-dark rounded-xl shadow-card dark:shadow-card-dark overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
              {article.cover_image_url && (
                <img src={article.cover_image_url} alt={article.title} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${trimesterColor[article.trimester] ?? 'bg-gray-100 text-gray-500'}`}>
                    {article.trimester === 'general' ? 'General' : `Trimester ${article.trimester}`}
                  </span>
                  {cachedIds.includes(article.id) && (
                    <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">offline_pin</span> Available Offline
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{article.read_time} min read</span>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{article.title}</h3>
              </div>
            </button>
          ))}
      </div>
    </div>
  )
}
