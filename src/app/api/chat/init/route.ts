import { NextResponse } from 'next/server'
import { conversations } from '../store'
import type { ChatMessage } from '@/types/chat'
import { getCharacter } from '@/data/characters'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const characterId = searchParams.get('characterId') || 'default'
  const character = await getCharacter(characterId)
  const conversationId = crypto.randomUUID()
  const messages: ChatMessage[] = character.greeting.map((g) => ({
    id: crypto.randomUUID(),
    role: 'npc',
    type: g.type === 'image' ? 'IMAGE' : 'TEXT',
    content: g.value as string,
    avatarUrl: character.avatarUrl,
    timestamp: new Date().toISOString(),
  }))
  conversations.set(conversationId, { characterId, messages, counters: {} })
  return NextResponse.json({ conversationId, messages })
}
