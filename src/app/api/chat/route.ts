import { NextResponse } from 'next/server'
import { conversations } from './store'
import type { ChatMessage } from '@/types/chat'
import { characters } from '@/data/characters'

export async function POST(req: Request) {
  const { conversationId, message } = await req.json()
  if (!conversationId || typeof message !== 'string') {
    return new NextResponse('Bad Request', { status: 400 })
  }
  const convo = conversations.get(conversationId)
  if (!convo) return new NextResponse('Not Found', { status: 404 })

  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    type: 'TEXT',
    content: message,
    timestamp: new Date().toISOString(),
  }
  convo.messages.push(userMsg)

  const character = characters[convo.characterId] || characters.default
  let replyText = character.defaultResponse
  for (const rule of character.rules) {
    if (rule.keywords.some((k) => message.includes(k))) {
      replyText = rule.response
      break
    }
  }
  const npcReply: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'npc',
    type: 'TEXT',
    content: replyText,
    avatarUrl: character.avatarUrl,
    timestamp: new Date().toISOString(),
  }
  convo.messages.push(npcReply)
  return NextResponse.json({ messages: [npcReply] })
}
