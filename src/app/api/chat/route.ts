import { NextResponse } from 'next/server'
import { conversations } from './store'
import type { ChatMessage } from '@/types/chat'

export async function POST(req: Request) {
  const { conversationId, message } = await req.json()
  if (!conversationId || typeof message !== 'string') {
    return new NextResponse('Bad Request', { status: 400 })
  }
  const msgs = conversations.get(conversationId)
  if (!msgs) return new NextResponse('Not Found', { status: 404 })
  const npcReply: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'npc',
    type: 'TEXT',
    content: `你說：${message}`,
    timestamp: new Date().toISOString(),
  }
  msgs.push(npcReply)
  return NextResponse.json({ messages: [npcReply] })
}
