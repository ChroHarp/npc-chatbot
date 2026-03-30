import { NextResponse } from 'next/server'
import { getConversation, addMessages } from './store'
import type { ChatMessage } from '@/types/chat'
import { getCharacter } from '@/data/characters'
import { db } from '@/libs/firebase'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'

export async function POST(req: Request) {
  const { conversationId, message } = await req.json()
  if (!conversationId || typeof message !== 'string') {
    return new NextResponse('Bad Request', { status: 400 })
  }
  const convo = await getConversation(conversationId)
  if (!convo) return new NextResponse('Not Found', { status: 404 })

  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    type: 'TEXT',
    content: message,
    timestamp: new Date().toISOString(),
  }

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

  const npcReplies: ChatMessage[] = []
  for (const resp of responses) {
    if (resp.type === 'item') {
      if (convo.teamCode) {
        const itemId = resp.value as string
        try {
          const itemSnap = await getDoc(doc(db, 'items', itemId))
          const itemName = itemSnap.exists() ? (itemSnap.data().name as string) : '未知物品'
          await updateDoc(doc(db, 'teams', convo.teamCode), {
            [`inventory.${itemId}`]: increment(1),
          })
          npcReplies.push({
            id: crypto.randomUUID(),
            role: 'npc',
            type: 'ITEM',
            content: itemName,
            avatarUrl: character.avatarUrl,
            avatarX: character.avatarX,
            avatarY: character.avatarY,
            avatarScale: character.avatarScale,
            timestamp: new Date().toISOString(),
          })
        } catch {
          // item dispatch failed silently — don't break the conversation
        }
      }
      continue
    }
    npcReplies.push({
      id: crypto.randomUUID(),
      role: 'npc',
      type: resp.type === 'image' ? 'IMAGE' : 'TEXT',
      content: resp.value as string,
      avatarUrl: character.avatarUrl,
      avatarX: character.avatarX,
      avatarY: character.avatarY,
      avatarScale: character.avatarScale,
      timestamp: new Date().toISOString(),
    })
  }

  await addMessages(conversationId, [userMsg, ...npcReplies])
  return NextResponse.json({ messages: npcReplies })
}
