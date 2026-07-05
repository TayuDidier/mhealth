import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { SEED_HEALTH_CONTENT } from '../../data/seedData'
import { useAuth } from '../../contexts/AuthContext'
import AppCard from '../../components/AppCard'
import AppButton from '../../components/AppButton'

const TRIMESTERS = [
  { value: '1', label: '1st Trimester' },
  { value: '2', label: '2nd Trimester' },
  { value: '3', label: '3rd Trimester' },
  { value: 'general', label: 'General' },
]

const EMPTY_FORM = { title: '', body: '', trimester: 'general', cover_image_url: '', read_time: 3 }

export default function ContentManagement() {
  const { isDemoMode } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (isDemoMode) {
        setArticles(SEED_HEALTH_CONTENT)
      } else {
        const { data } = await supabase.from('health_content').select('*').order('created_at', { ascending: false })
        setArticles(data || [])
      }
      setLoading(false)
    }
    load()
  }, [isDemoMode])

  function startEdit(article) {
    setEditing(article.id)
    setForm({ title: article.title, body: article.body, trimester: article.trimester, cover_image_url: article.cover_image_url, read_time: article.read_time })
  }

  function startNew() {
    setEditing('new')
    setForm(EMPTY_FORM)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    if (editing === 'new') {
      const newArticle = { id: `article-${Date.now()}`, ...form, created_at: new Date().toISOString() }
      if (!isDemoMode) await supabase.from('health_content').insert(form)
      setArticles(prev => [newArticle, ...prev])
    } else {
      if (!isDemoMode) await supabase.from('health_content').update(form).eq('id', editing)
      setArticles(prev => prev.map(a => a.id === editing ? { ...a, ...form } : a))
    }
    setEditing(null)
    setSaving(false)
  }

  async function remove(id) {
    if (!window.confirm('Delete this article?')) return
    if (!isDemoMode) await supabase.from('health_content').delete().eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const trimColor = { '1': 'bg-pink-100 text-pink-700', '2': 'bg-teal-100 text-teal-700', '3': 'bg-orange-100 text-orange-700', 'general': 'bg-lavender-soft text-purple-700' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Knowledge Hub Content</h1>
        <AppButton onClick={startNew}>
          <span className="material-symbols-outlined text-sm">add</span>
          New Article
        </AppButton>
      </div>

      {editing && (
        <AppCard className="p-5">
          <h2 className="font-bold text-gray-800 dark:text-white mb-4">{editing === 'new' ? 'New Article' : 'Edit Article'}</h2>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Trimester</label>
                <select value={form.trimester} onChange={e => setForm(f => ({ ...f, trimester: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {TRIMESTERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Read Time (min)</label>
                <input type="number" min={1} max={30} value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: Number(e.target.value) }))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cover Image URL</label>
                <input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder="https://..."
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Body (Markdown supported)</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} required
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-background-dark dark:text-white rounded px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y" />
              </div>
            </div>
            <div className="flex gap-3">
              <AppButton type="submit" loading={saving}>Save Article</AppButton>
              <AppButton type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</AppButton>
            </div>
          </form>
        </AppCard>
      )}

      {loading && <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map(a => (
          <div key={a.id} className="bg-white dark:bg-card-dark rounded-xl shadow-card overflow-hidden">
            {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} className="w-full h-32 object-cover" />}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${trimColor[a.trimester] ?? 'bg-gray-100 text-gray-500'}`}>
                  {a.trimester === 'general' ? 'General' : `Trimester ${a.trimester}`}
                </span>
                <span className="text-xs text-gray-400">{a.read_time}m</span>
              </div>
              <p className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-3 leading-tight">{a.title}</p>
              <div className="flex gap-2">
                <button onClick={() => startEdit(a)} className="text-xs text-primary font-semibold hover:underline">Edit</button>
                <button onClick={() => remove(a.id)} className="text-xs text-red-500 font-semibold hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
