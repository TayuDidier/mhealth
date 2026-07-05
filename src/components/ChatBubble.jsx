import { timeAgo } from '../utils/dateHelpers'

export default function ChatBubble({ message, sent }) {
  return (
    <div className={`flex ${sent ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[78%] ${sent ? 'bg-primary text-white rounded-2xl rounded-br-sm' : 'bg-white dark:bg-card-dark text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-sm shadow-card'} px-4 py-3`}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className={`text-xs mt-1 ${sent ? 'text-pink-200' : 'text-gray-400'}`}>
          {timeAgo(message.created_at)}
          {sent && message.read_at && (
            <span className="ml-1">
              <span className="material-symbols-outlined text-xs align-middle">done_all</span>
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
