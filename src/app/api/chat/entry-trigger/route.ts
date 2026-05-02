import { NextResponse } from 'next/server'
import { getConversation, addMessages, markEntryRuleTriggered } from '../store'
import type { ChatMessage } from '@/types/chat'
import { getCharacter } from '@/data/characters'
import { db } from '@/libs/firebase'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { findConditionOnlyRule, type ConditionContext } from '@/lib/ruleEngine'
import type { RuleCondition } from '@/types'

/** 產生規則的穩定指紋，用於判斷「是否已觸發過」 */
function ruleFingerprint(priority: number | undefined, conditions: RuleCondition): string {
  const sorted = Object.fromEntries(
    Object.keys(conditions)
      .sort()
      .map((k) => [k, conditions[k as keyof RuleCondition]]),
  )
  return `p${priority ?? 0}:${JSON.stringify(sorted)}`
}

export async function POST(req: Request) {
  const { conversationId } = await req.json()
  if (!conversationId) return new NextResponse('Bad Request', { status: 400 })

  const convo = await getConversation(conversationId)
  if (!convo) return new NextResponse('Not Found', { status: 404 })

  const character = await getCharacter(convo.characterId)

  let inventory: Record<string, number> = {}
  let taskProgress: Record<string, string> = {}
  if (convo.teamCode) {
    try {
      const teamSnap = await getDoc(doc(db, 'teams', convo.teamCode))
      if (teamSnap.exists()) {
        const d = teamSnap.data()
        inventory = (d.inventory ?? {}) as Record<string, number>
        taskProgress = (d.taskProgress ?? {}) as Record<string, string>
      }
    } catch {
      // fallback to empty — don't block entry
    }
  }

  const elapsedMinutes = convo.createdAt
    ? (Date.now() - convo.createdAt.getTime()) / 60_000
    : 0
  const ctx: ConditionContext = { inventory, taskProgress, elapsedMinutes }

  const matched = findConditionOnlyRule(character.rules, ctx)
  if (!matched) return NextResponse.json({ messages: [] })

  // 每條 condition-only 規則在同一對話內只觸發一次（重置對話才能再觸發）
  const fingerprint = ruleFingerprint(matched.priority, matched.conditions!)
  if (convo.triggeredEntryRules.includes(fingerprint)) {
    return NextResponse.json({ messages: [] })
  }

  const npcReplies: ChatMessage[] = []
  for (const resp of matched.responses) {
    if (resp.type === 'item') {
      // 進入觸發也支援派發物品（不扣除玩家物品）
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
          const currentInv = (teamSnap.data()?.inventory ?? {}) as Record<string, number>
          const current = currentInv[itemId] ?? 0

          if ((!item.stackable && current >= 1) || (item.maxPerTeam != null && current >= item.maxPerTeam)) {
            npcReplies.push({
              id: crypto.randomUUID(),
              role: 'npc',
              type: 'SYSTEM',
              content: `已達「${itemName}」持有上限`,
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
            itemImageUrl: item.imageUrl ?? undefined,
            itemImageScale: item.imageScale ?? undefined,
            itemImageX: item.imageX ?? undefined,
            itemImageY: item.imageY ?? undefined,
            avatarUrl: character.avatarUrl,
            avatarX: character.avatarX,
            avatarY: character.avatarY,
            avatarScale: character.avatarScale,
            timestamp: new Date().toISOString(),
          })
        } catch {
          // silent fail
        }
      }
      continue
    }

    npcReplies.push({
      id: crypto.randomUUID(),
      role: 'npc',
      type: resp.type === 'image' ? 'IMAGE' : resp.type === 'system' ? 'SYSTEM' : 'TEXT',
      content: resp.value as string,
      avatarUrl: character.avatarUrl,
      avatarX: character.avatarX,
      avatarY: character.avatarY,
      avatarScale: character.avatarScale,
      timestamp: new Date().toISOString(),
    })
  }

  if (npcReplies.length > 0) {
    await addMessages(conversationId, npcReplies)
  }

  // 無論有無回應訊息，都記錄為已觸發（避免條件持續滿足時反覆觸發）
  await markEntryRuleTriggered(conversationId, fingerprint)

  return NextResponse.json({ messages: npcReplies })
}
