'use client'
import { Suspense, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams, useSearchParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { db } from '@/libs/firebase'
import type { CharacterDoc } from '@/types'
import Link from 'next/link'
import { ChatBubble } from '@/components/ChatBubble'
import { ChatSetup } from '@/components/ChatSetup'
import type { ChatMessage } from '@/types/chat'
import { useChat } from '@/hooks/useChat'

// Separated so useChat is only mounted after setup is complete
function ChatView({ characterId, data, useItemId }: { characterId: string; data: CharacterDoc | undefined; useItemId?: string | null }) {
  const { messages, send, loading, ready, error } = useChat(characterId)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const autoSentRef = useRef(false)
  // Keep a ref to the latest send so the effect doesn't re-run whenever send changes
  const sendRef = useRef(send)
  sendRef.current = send

  // Auto-send "使用[itemName]" when navigated from inventory
  useEffect(() => {
    if (!useItemId || !ready || autoSentRef.current) return
    autoSentRef.current = true
    getDoc(doc(db, 'items', useItemId)).then((snap) => {
      if (!snap.exists()) return
      const itemName = snap.data().name as string
      sendRef.current(`使用${itemName}`, useItemId)
      // Clean up URL param without triggering React navigation (avoids Suspense reset)
      window.history.replaceState(null, '', `/chat/${characterId}`)
    })
  }, [useItemId, ready, characterId])

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

function CharacterChatPageContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const characterId = id || 'default'
  const useItemId = searchParams.get('useItem')
  const [value] = useDocument(
    characterId !== 'default' ? doc(db, 'characters', characterId) : undefined,
  )
  const data = value?.data() as CharacterDoc | undefined

  // Manage teamCode locally so it updates immediately when setup completes
  const [teamCode, setTeamCode] = useState<string | null>(null)
  // null = checking localStorage, false = needs setup, true = ready for chat
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)

  useEffect(() => {
    const storedTeam = localStorage.getItem('teamCode')
    const hasConversation = !!localStorage.getItem(`conversationId-${characterId}`)
    setTeamCode(storedTeam)
    setSetupComplete(!!storedTeam || hasConversation)
  }, [characterId])

  function handleSetupComplete(code: string) {
    setTeamCode(code)
    setSetupComplete(true)
  }

  function handleClear() {
    // Only clear this user's local state — do NOT modify the team doc.
    // Other team members keep their shared conversation; this user simply
    // leaves the team and will re-join (or join a different one) via setup.
    localStorage.removeItem(`conversationId-${characterId}`)
    localStorage.removeItem(`taskId-${characterId}`)
    localStorage.removeItem('teamCode')
    setTeamCode(null)
    setSetupComplete(false)
  }

  const characterLoaded = characterId === 'default' || !!data

  return (
    <div className="h-dvh flex flex-col max-w-md mx-auto w-full bg-gradient-to-b from-white to-teal-50 dark:bg-neutral-950">
      <header className="p-4 border-b flex items-center bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow">
        <h1 className="font-semibold text-lg flex-1 truncate">{data?.name || 'NPC Chat'}</h1>
        <div className="flex-1 flex justify-center">
          {teamCode && (
            <span className="font-mono font-bold tracking-widest text-sm bg-white/20 px-2 py-0.5 rounded">
              {teamCode}
            </span>
          )}
        </div>
        <div className="flex-1 flex justify-end items-center gap-3">
          {teamCode && (
            <Link href={`/inventory?from=${characterId}`} className="text-sm text-white/80 shrink-0">
              背包
            </Link>
          )}
          {setupComplete && (
            <button className="text-sm text-white shrink-0" onClick={handleClear}>
              重設任務
            </button>
          )}
        </div>
      </header>

      {setupComplete === null ? (
        <div className="flex-1" />
      ) : !setupComplete ? (
        <ChatSetup
          characterId={characterId}
          characterTasks={data?.tasks ?? []}
          characterLoaded={characterLoaded}
          onComplete={handleSetupComplete}
        />
      ) : (
        <ChatView characterId={characterId} data={data} useItemId={useItemId} />
      )}
    </div>
  )
}

export default function CharacterChatPage() {
  return <Suspense><CharacterChatPageContent /></Suspense>
}
