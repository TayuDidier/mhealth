import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabaseClient'
import { SEED_MESSAGES, SEED_PATIENTS, SEED_PROVIDERS } from '../../data/seedData'
import { useNetwork } from '../../hooks/useNetwork'
import PageHeader from '../../components/PageHeader'
import ChatBubble from '../../components/ChatBubble'
import SkeletonCard from '../../components/SkeletonCard'

function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function timeLabel(iso) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  const { profile, isDemoMode } = useAuth()
  const online = useNetwork()
  const [view, setView] = useState('inbox') // 'inbox' | 'search' | 'chat'
  const [conversations, setConversations] = useState([])
  const [allProviders, setAllProviders] = useState([])
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [text, setText] = useState('')
  const [loadingInbox, setLoadingInbox] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const myId = isDemoMode
    ? (SEED_PATIENTS.find(p => p.email === profile?.email) || SEED_PATIENTS[0])?.id
    : profile?.id

  // ── Inbox ────────────────────────────────────────────────────
  async function loadInbox() {
    setLoadingInbox(true)

    if (isDemoMode) {
      const grouped = {}
      for (const msg of SEED_MESSAGES) {
        const mine = msg.sender_id === myId || msg.receiver_id === myId
        if (!mine) continue
        const partnerId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id
        if (!grouped[partnerId]) {
          grouped[partnerId] = { partnerId, lastMessage: msg, unread: 0 }
        } else if (new Date(msg.created_at) > new Date(grouped[partnerId].lastMessage.created_at)) {
          grouped[partnerId].lastMessage = msg
        }
        if (!msg.read_at && msg.receiver_id === myId) grouped[partnerId].unread++
      }
      setConversations(
        Object.values(grouped)
          .map(c => ({ ...c, partner: SEED_PROVIDERS.find(p => p.id === c.partnerId) || { id: c.partnerId, name: 'Unknown' } }))
          .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at))
      )
      setLoadingInbox(false)
      return
    }

    if (!profile) { setLoadingInbox(false); return }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })

    const grouped = {}
    for (const msg of msgs || []) {
      const partnerId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id
      if (!grouped[partnerId]) grouped[partnerId] = { partnerId, lastMessage: msg, unread: 0 }
      if (!msg.read_at && msg.receiver_id === profile.id) grouped[partnerId].unread++
    }

    const partnerIds = Object.keys(grouped)
    if (partnerIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, role')
        .in('id', partnerIds)
      for (const u of users || []) grouped[u.id].partner = u
    }

    setConversations(
      Object.values(grouped)
        .filter(c => c.partner)
        .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at))
    )
    setLoadingInbox(false)
  }

  // ── Provider list for search ──────────────────────────────────
  async function loadProviders() {
    if (isDemoMode) { setAllProviders(SEED_PROVIDERS); return }
    const { data: users } = await supabase
      .from('users').select('id, name').eq('role', 'provider')
    if (!users?.length) { setAllProviders([]); return }
    const { data: details } = await supabase
      .from('providers').select('user_id, specialty')
      .in('user_id', users.map(u => u.id))
    setAllProviders(users.map(u => ({
      id: u.id,
      name: u.name,
      specialty: details?.find(d => d.user_id === u.id)?.specialty || '',
    })))
  }

  // ── Chat ─────────────────────────────────────────────────────
  async function loadChat(partner) {
    setLoadingChat(true)
    if (isDemoMode) {
      setMessages(
        SEED_MESSAGES
          .filter(m => (m.sender_id === myId && m.receiver_id === partner.id) ||
                       (m.sender_id === partner.id && m.receiver_id === myId))
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      )
      setLoadingChat(false)
      return
    }
    if (!profile?.id) { setLoadingChat(false); return }
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoadingChat(false)
  }

  useEffect(() => { loadInbox(); loadProviders() }, [profile])

  useEffect(() => {
    if (!selectedPartner) return
    loadChat(selectedPartner)
  }, [selectedPartner])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Realtime for chat view
  useEffect(() => {
    if (isDemoMode || !profile || !selectedPartner) return
    const channel = supabase.channel(`patient-chat-${selectedPartner.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: msg }) => {
        const isRelevant =
          (msg.sender_id === profile.id && msg.receiver_id === selectedPartner.id) ||
          (msg.sender_id === selectedPartner.id && msg.receiver_id === profile.id)
        if (isRelevant) setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profile, selectedPartner, isDemoMode])

  function openChat(partner) {
    setSelectedPartner(partner)
    setSearchQuery('')
    setView('chat')
  }

  function backToInbox() {
    window.scrollTo(0, 0)
    setSelectedPartner(null)
    setMessages([])
    setView('inbox')
    loadInbox()
  }

  async function send(e) {
    e.preventDefault()
    if (!text.trim() || !online || !selectedPartner || !profile?.id) return
    setSending(true)
    if (isDemoMode) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`, sender_id: myId, receiver_id: selectedPartner.id,
        content: text.trim(), created_at: new Date().toISOString(), read_at: null,
      }])
    } else {
      const { data } = await supabase.from('messages')
        .insert({ sender_id: profile.id, receiver_id: selectedPartner.id, content: text.trim() })
        .select().single()
      if (data) setMessages(prev => [...prev, data])
    }
    setText('')
    setSending(false)
  }

  const filteredProviders = allProviders.filter(p =>
    !searchQuery ||
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── INBOX VIEW ───────────────────────────────────────────────
  if (view === 'inbox') return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Messages"
        action={
          <button
            onClick={() => setView('search')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            title="New message"
          >
            <span className="material-symbols-outlined text-primary text-xl">edit_square</span>
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto">
        {loadingInbox ? (
          <SkeletonCard lines={3} className="m-4" />
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 px-6">
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-5xl mb-3 block">chat_bubble</span>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No conversations yet</p>
            <button onClick={() => setView('search')} className="mt-3 text-sm text-primary font-semibold hover:underline">
              Message a provider
            </button>
          </div>
        ) : conversations.map(c => (
          <button
            key={c.partnerId}
            onClick={() => openChat(c.partner)}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-card-dark transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 text-sm">
              {initials(c.partner?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{c.partner?.name}</p>
                <p className="text-xs text-gray-400 flex-shrink-0">{timeLabel(c.lastMessage.created_at)}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{c.lastMessage.content}</p>
            </div>
            {c.unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {c.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  // ── SEARCH VIEW ──────────────────────────────────────────────
  if (view === 'search') return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="New Message"
        action={
          <button onClick={() => setView('inbox')} className="text-sm text-primary font-semibold">Cancel</button>
        }
      />
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search providers by name or specialty…"
            className="w-full bg-gray-100 dark:bg-background-dark dark:text-white rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredProviders.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">No providers found.</p>
        ) : filteredProviders.map(p => (
          <button
            key={p.id}
            onClick={() => openChat(p)}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-card-dark transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 text-sm">
              {initials(p.name)}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{p.name}</p>
              {p.specialty && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {p.specialty}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // ── CHAT VIEW ────────────────────────────────────────────────
  return (
    <div key="chat" className="flex flex-col h-screen">
      <PageHeader
        title={selectedPartner?.name || 'Chat'}
        action={
          <button onClick={backToInbox} className="flex items-center gap-1 text-sm text-primary font-semibold">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loadingChat ? (
          <SkeletonCard lines={4} />
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            No messages yet. Say hello!
          </div>
        ) : messages.map(m => (
          <ChatBubble key={m.id} message={m} sent={m.sender_id === myId} />
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-card-dark border-t border-gray-100 dark:border-gray-700 pb-safe">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          disabled={!online}
          className="flex-1 bg-gray-100 dark:bg-background-dark dark:text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending || !online}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors"
        >
          <span className="material-symbols-outlined text-xl">send</span>
        </button>
      </form>
    </div>
  )
}
