import { NextResponse } from 'next/server'
import { conversations } from '../store'
import type { ChatMessage } from '@/types/chat'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const characterId = searchParams.get('characterId') || 'default'
  const conversationId = crypto.randomUUID()
  const messages: ChatMessage[] = [
    {
      id: crypto.randomUUID(),
      role: 'npc',
      type: 'TEXT',
      content: `你好，我是 ${characterId}`,
      timestamp: new Date().toISOString(),
    },
  ]
  conversations.set(conversationId, messages)
  return NextResponse.json({ conversationId, messages })
}
