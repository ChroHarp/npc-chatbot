import { NextResponse } from 'next/server'
import { getConversation, addMessages } from './store'
import type { ChatMessage } from '@/types/chat'
import { getCharacter } from '@/data/characters'
import { db } from '@/libs/firebase'
import { doc, getDoc, updateDoc, increment, deleteField } from 'firebase/firestore'

export async function POST(req: Request) {
  const { conversationId, message, itemId } = await req.json()
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
  let ruleMatched = false
  const lowerMsg = message.toLowerCase()
  for (let i = 0; i < character.rules.length; i++) {
    const rule = character.rules[i]
    if (rule.keywords.some((k) => lowerMsg.includes(k.toLowerCase()))) {
      responses = rule.responses
      ruleMatched = true
      break
    }
  }

  // If player used an item and a non-default rule matched, deduct the item
  if (itemId && ruleMatched && convo.teamCode) {
    try {
      const teamRef = doc(db, 'teams', convo.teamCode)
      const teamSnap = await getDoc(teamRef)
      const inventory = (teamSnap.data()?.inventory ?? {}) as Record<string, number>
      const current = inventory[itemId] ?? 0
      if (current >= 1) {
        await updateDoc(teamRef, {
          [`inventory.${itemId}`]: current === 1 ? deleteField() : increment(-1),
        })
      }
    } catch {
      // Deduction failed silently — don't block the conversation
    }
  }

  const npcReplies: ChatMessage[] = []
  for (const resp of responses) {
    if (resp.type === 'item') {
      if (convo.teamCode) {
        const itemId = resp.value as string
        try {
          const [itemSnap, teamSnap] = await Promise.all([
            getDoc(doc(db, 'items', itemId)),
            getDoc(doc(db, 'teams', convo.teamCode)),
          ])
          if (!itemSnap.exists()) continue
          const item = itemSnap.data()
          const itemName = item.name as string
          const inventory = (teamSnap.data()?.inventory ?? {}) as Record<string, number>
          const current = inventory[itemId] ?? 0

          // Respect stackable and maxPerTeam constraints
          if ((!item.stackable && current >= 1) || (item.maxPerTeam != null && current >= item.maxPerTeam)) {
            npcReplies.push({
              id: crypto.randomUUID(),
              role: 'npc',
              type: 'TEXT',
              content: `（已達「${itemName}」持有上限）`,
              avatarUrl: character.avatarUrl,
              avatarX: character.avatarX,
              avatarY: character.avatarY,
              avatarScale: character.avatarScale,
              timestamp: new Date().toISOString(),
            })
            continue
          }

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
