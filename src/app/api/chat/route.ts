import { NextResponse } from 'next/server'
import { conversations } from './store'
import type { ChatMessage } from '@/types/chat'
import { getCharacter } from '@/data/characters'

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

  const character = await getCharacter(convo.characterId)
  let responses = character.defaultResponses
  const lowerMsg = message.toLowerCase()
  for (let i = 0; i < character.rules.length; i++) {
    const rule = character.rules[i]
    if (rule.keywords.some((k) => lowerMsg.includes(k.toLowerCase()))) {
      responses = rule.responses
      break
    }
  }

  const npcReplies: ChatMessage[] = responses.map((resp) => ({
    id: crypto.randomUUID(),
    role: 'npc',
    type: resp.type === 'image' ? 'IMAGE' : 'TEXT',
    content: resp.value as string,
    avatarUrl: character.avatarUrl,
    avatarX: character.avatarX,
    avatarY: character.avatarY,
    avatarScale: character.avatarScale,
    timestamp: new Date().toISOString(),
  }))
  convo.messages.push(...npcReplies)
  return NextResponse.json({ messages: npcReplies })
}
