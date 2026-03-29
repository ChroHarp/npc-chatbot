'use client'
import { useEffect, useState, useCallback } from 'react'
import type { ChatMessage } from '@/types/chat'
import { auth, db } from '@/libs/firebase'
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore'

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
      try {
        setLoading(true)
        setError(null)

        const teamCode = localStorage.getItem('teamCode')
        const uid = auth.currentUser?.uid ?? null

        if (!force && teamCode) {
          // Team mode: team doc is the source of truth — always check it first,
          // regardless of what's cached in localStorage
          const teamSnap = await getDoc(doc(db, 'teams', teamCode))
          const teamConvId = (
            teamSnap.data()?.conversations as Record<string, string> | undefined
          )?.[characterId]

          if (teamConvId) {
            localStorage.setItem(storageKey, teamConvId)
            setConversationId(teamConvId)
            const res = await fetch(`/api/chat/history?conversationId=${teamConvId}`)
            if (!res.ok) {
              if (res.status === 404) {
                // Shared conversation was deleted — clear and create a new one
                localStorage.removeItem(storageKey)
                try {
                  await updateDoc(doc(db, 'teams', teamCode), {
                    [`conversations.${characterId}`]: deleteField(),
                  })
                } catch {}
                return init(true)
              }
              throw new Error('history failed')
            }
            const data: HistoryResponse = await res.json()
            setMessages(data.messages || [])
            return
          }
          // Team has no conversation for this character yet — create one below
        } else if (!force) {
          // No team: use localStorage cache normally
          const localId = localStorage.getItem(storageKey)
          if (localId) {
            setConversationId(localId)
            const res = await fetch(`/api/chat/history?conversationId=${localId}`)
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
            return
          }
        }

        // Create new conversation (no team conversation found, or force reset)
        const params = new URLSearchParams({ characterId })
        if (teamCode) params.set('teamCode', teamCode)
        if (uid) params.set('uid', uid)
        const res = await fetch(`/api/chat/init?${params}`)
        if (!res.ok) throw new Error('init failed')
        const data: InitResponse = await res.json()
        localStorage.setItem(storageKey, data.conversationId)
        setConversationId(data.conversationId)
        setMessages([])

        // Register in team doc so all teammates share this conversation
        if (teamCode) {
          try {
            await updateDoc(doc(db, 'teams', teamCode), {
              [`conversations.${characterId}`]: data.conversationId,
            })
          } catch {}
        }

        void appendMessagesSequentially(data.messages || [])
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
          localStorage.removeItem(storageKey)
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

  return { messages, send, loading, error }
}
