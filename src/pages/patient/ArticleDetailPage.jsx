import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { SEED_HEALTH_CONTENT } from '../../data/seedData'
import { useAuth } from '../../contexts/AuthContext'
import PageHeader from '../../components/PageHeader'
import SkeletonCard from '../../components/SkeletonCard'

function renderBody(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h4 key={i} className="font-bold text-gray-800 dark:text-gray-100 mt-4 mb-1">{line.replace(/\*\*/g, '')}</h4>
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="ml-4 text-gray-600 dark:text-gray-300 text-sm">{line.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</li>
    }
    if (line.trim() === '') return <div key={i} className="h-2" />
    return <p key={i} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, (_, m) => `**${m}**`)}</p>
  })
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const { isDemoMode } = useAuth()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setArticle(SEED_HEALTH_CONTENT.find(a => a.id === id) || null)
      setLoading(false)
      return
    }
    supabase.from('health_content').select('*').eq('id', id).single()
      .then(({ data }) => { setArticle(data); setLoading(false) })
  }, [id])

  return (
    <div>
      <PageHeader title="Article" backButton />
      {loading ? (
        <div className="p-4 space-y-3"><SkeletonCard lines={5} /></div>
      ) : !article ? (
        <p className="text-center text-gray-500 py-16">Article not found.</p>
      ) : (
        <article className="px-4 pb-8">
          {article.cover_image_url && (
            <img src={article.cover_image_url} alt={article.title} className="w-full h-48 object-cover rounded-xl mt-4 mb-5" />
          )}
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">{article.title}</h1>
          <p className="text-xs text-gray-400 mb-5">{article.read_time} min read</p>
          <div className="space-y-1">{renderBody(article.body)}</div>
        </article>
      )}
    </div>
  )
}
