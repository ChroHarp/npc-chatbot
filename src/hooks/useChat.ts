'use client'
import { useEffect, useState, useCallback } from 'react'
import type { ChatMessage } from '@/types/chat'

interface InitResponse {
  conversationId: string
  messages: ChatMessage[]
}

interface HistoryResponse {
  messages: ChatMessage[]
}

interface PostResponse {
  messages: ChatMessage[]
}

export function useChat(characterId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const storageKey = `conversationId-${characterId}`

  async function appendMessagesSequentially(msgs: ChatMessage[]) {
    for (let i = 0; i < msgs.length; i++) {
      setMessages((prev) => [...prev, msgs[i]])
      if (i < msgs.length - 1) {
        const typingId = `typing-${Date.now()}-${i}`
        const typingMsg: ChatMessage = {
          id: typingId,
          role: 'npc',
          type: 'TEXT',
          content: '...',
          typing: true,
        }
        setMessages((prev) => [...prev, typingMsg])
        await new Promise((res) => setTimeout(res, 1500))
        setMessages((prev) => prev.filter((m) => m.id !== typingId))
      }
    }
  }

  const init = useCallback(
    async (force?: boolean) => {
      const id = force ? null : localStorage.getItem(storageKey)
      try {
        setLoading(true)
        setError(null)
        if (!id) {
          const res = await fetch(`/api/chat/init?characterId=${characterId}`)
          if (!res.ok) throw new Error('init failed')
          const data: InitResponse = await res.json()
          localStorage.setItem(storageKey, data.conversationId)
          setConversationId(data.conversationId)
          setMessages([])
          void appendMessagesSequentially(data.messages || [])
        } else {
          setConversationId(id)
          const res = await fetch(`/api/chat/history?conversationId=${id}`)
          if (!res.ok) {
            if (res.status === 404) {
              localStorage.removeItem(storageKey)
              setConversationId(null)
              return init(true)
            }
            throw new Error('history failed')
          }
          const data: HistoryResponse = await res.json()
          setMessages(data.messages || [])
        }
      } catch {
        setError('載入失敗')
      } finally {
        setLoading(false)
      }
    },
    [characterId, storageKey],
  )

  useEffect(() => {
    init()
  }, [init])

  async function send(text: string) {
    if (!conversationId) return
    const local: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      type: 'TEXT',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, local])
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      })
      if (!res.ok) {
        if (res.status === 404) {
          clear()
          throw new Error('not found')
        }
        throw new Error('post failed')
      }
      const data: PostResponse = await res.json()
      void appendMessagesSequentially(data.messages)
    } catch {
      setError('送出失敗')
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    localStorage.removeItem(storageKey)
    setConversationId(null)
    setMessages([])
    init(true)
  }

  return { messages, send, clear, loading, error }
}
