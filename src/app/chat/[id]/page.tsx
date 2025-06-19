'use client'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
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

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    send(text.trim())
    setText('')
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <div className="h-dvh flex flex-col max-w-md mx-auto w-full bg-gradient-to-b from-white to-teal-50 dark:bg-neutral-950">
      <header className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-teal-500 to-teal-600 text-white">
        <h1 className="font-semibold text-lg">{data?.name || 'NPC Chat'}</h1>
        <button className="text-sm text-white" onClick={clear}>
          重設對話
        </button>
      </header>
      {data?.avatarUrl && (
        <div className="flex justify-center p-4">
          <div className="relative w-4/5 aspect-square overflow-hidden rounded-lg">
            <Image
              src={data.avatarUrl}
              alt={data.name}
              fill
              className="object-cover"
              style={{
                transform: `translate(${data.avatarX ?? 0}%, ${data.avatarY ?? 0}%) scale(${
                  data.avatarScale ?? 1
                })`,
              }}
            />
          </div>
        </div>
      )}
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
        <input
          type="text"
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!text.trim()}
        >
          送出
        </button>
      </form>
    </div>
  )
}
