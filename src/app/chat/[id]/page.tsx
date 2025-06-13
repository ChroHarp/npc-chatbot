'use client'
import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { db } from '@/libs/firebase'
import type { CharacterDoc } from '@/types'
import { ChatBubble } from '@/components/ChatBubble'
import type { ChatMessage } from '@/types/chat'
import { useChat } from '@/hooks/useChat'

export default function CharacterChatPage() {
  const { id } = useParams<{ id: string }>()
  const characterId = id || 'default'
  const [value] = useDocument(
    characterId ? doc(db, 'characters', characterId) : undefined,
  )
  const data = value?.data() as CharacterDoc | undefined
  const { messages, send, clear, loading, error } = useChat(characterId)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    send(text.trim())
    setText('')
    ;(document.activeElement as HTMLElement | null)?.blur()
    setTimeout(() => {
      listRef.current?.scrollTo(0, listRef.current.scrollHeight)
    }, 50)
  }

  return (
    <div className="h-dvh flex flex-col max-w-md mx-auto w-full bg-white">
      <header className="p-4 border-b flex justify-between items-center">
        <h1 className="font-semibold">{data?.name || 'NPC Chat'}</h1>
        <button className="text-sm text-red-600" onClick={clear}>
          清除
        </button>
      </header>
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2 pb-28">
        {messages.map((m: ChatMessage) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {loading && <p className="text-center text-sm text-gray-500">載入中...</p>}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 bg-white dark:bg-neutral-900 p-4 flex gap-2 border-t"
      >
        <textarea
          className="flex-1 border rounded p-2 resize-none h-10"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={!text.trim()}
        >
          送出
        </button>
      </form>
    </div>
  )
}
