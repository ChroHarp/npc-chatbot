'use client'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { db } from '@/libs/firebase'
import type { CharacterDoc } from '@/types'
import { ChatBubble } from '@/components/ChatBubble'
import { ChatSetup } from '@/components/ChatSetup'
import { useTeam } from '@/hooks/useTeam'
import type { ChatMessage } from '@/types/chat'
import { useChat } from '@/hooks/useChat'

// Separated so useChat is only mounted after setup is complete
function ChatView({ characterId, data }: { characterId: string; data: CharacterDoc | undefined }) {
  const { messages, send, loading, error } = useChat(characterId)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    send(text.trim())
    setText('')
    const target = (e.target as HTMLFormElement).querySelector('textarea')
    if (target) target.style.height = '40px'
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <>
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
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 pb-28 scroll-smooth no-scrollbar"
      >
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
          className="chat-input resize-none overflow-y-auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = '40px'
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`
          }}
          rows={1}
        />
        <button type="submit" className="send-button" disabled={!text.trim()}>
          送出
        </button>
      </form>
    </>
  )
}

export default function CharacterChatPage() {
  const { id } = useParams<{ id: string }>()
  const characterId = id || 'default'
  const [value] = useDocument(
    characterId !== 'default' ? doc(db, 'characters', characterId) : undefined,
  )
  const data = value?.data() as CharacterDoc | undefined
  const { teamCode } = useTeam()

  // null = checking, false = needs setup, true = ready for chat
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)

  useEffect(() => {
    const hasConversation = !!localStorage.getItem(`conversationId-${characterId}`)
    const hasTeam = !!localStorage.getItem('teamCode')
    // Skip setup if user already has a team or an existing conversation
    setSetupComplete(hasConversation || hasTeam)
  }, [characterId])

  async function handleClear() {
    const code = localStorage.getItem('teamCode')
    localStorage.removeItem(`conversationId-${characterId}`)
    localStorage.removeItem(`taskId-${characterId}`)
    // Remove shared conversation from team so all members start fresh
    if (code) {
      try {
        await updateDoc(doc(db, 'teams', code), {
          [`conversations.${characterId}`]: deleteField(),
        })
      } catch {
        // Non-critical — proceed regardless
      }
    }
    setSetupComplete(false)
  }

  const characterLoaded = characterId === 'default' || !!data

  return (
    <div className="h-dvh flex flex-col max-w-md mx-auto w-full bg-gradient-to-b from-white to-teal-50 dark:bg-neutral-950">
      <header className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow">
        <div className="flex flex-col">
          <h1 className="font-semibold text-lg leading-tight">{data?.name || 'NPC Chat'}</h1>
          {teamCode && (
            <span className="text-xs text-teal-100">小隊 {teamCode}</span>
          )}
        </div>
        {setupComplete && (
          <button className="text-sm text-white shrink-0" onClick={handleClear}>
            重設任務
          </button>
        )}
      </header>

      {setupComplete === null ? (
        <div className="flex-1" />
      ) : !setupComplete ? (
        <ChatSetup
          characterId={characterId}
          characterTasks={data?.tasks ?? []}
          characterLoaded={characterLoaded}
          onComplete={() => setSetupComplete(true)}
        />
      ) : (
        <ChatView characterId={characterId} data={data} />
      )}
    </div>
  )
}
