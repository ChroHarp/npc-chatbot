import { NextResponse } from 'next/server'
import { conversations } from '../store'
import type { ChatMessage } from '@/types/chat'
import { getCharacter } from '@/data/characters'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const characterId = searchParams.get('characterId') || 'default'
  const character = await getCharacter(characterId)
  const conversationId = crypto.randomUUID()
  const messages: ChatMessage[] = [
    {
      id: crypto.randomUUID(),
      role: 'npc',
      type: 'TEXT',
      content: character.greeting,
      avatarUrl: character.avatarUrl,
      timestamp: new Date().toISOString(),
    },
  ]
  conversations.set(conversationId, { characterId, messages })
  return NextResponse.json({ conversationId, messages })
}
