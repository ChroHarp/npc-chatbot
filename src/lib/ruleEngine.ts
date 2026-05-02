import type { RuleCondition } from '@/types'
import type { CharacterRule } from '@/data/characters'

export interface ConditionContext {
  inventory: Record<string, number>
  taskProgress: Record<string, string>
  elapsedMinutes: number
}

export function evaluateConditions(
  conditions: RuleCondition | undefined,
  ctx: ConditionContext,
): boolean {
  if (!conditions) return true

  const { inventory, taskProgress, elapsedMinutes } = ctx

  if (conditions.minElapsedMinutes !== undefined && elapsedMinutes < conditions.minElapsedMinutes)
    return false

  if (conditions.maxElapsedMinutes !== undefined && elapsedMinutes > conditions.maxElapsedMinutes)
    return false

  if (conditions.requireItems?.length) {
    for (const id of conditions.requireItems) {
      if ((inventory[id] ?? 0) < 1) return false
    }
  }

  if (conditions.requireAnyItem?.length) {
    if (!conditions.requireAnyItem.some((id) => (inventory[id] ?? 0) >= 1)) return false
  }

  if (conditions.forbidItems?.length) {
    for (const id of conditions.forbidItems) {
      if ((inventory[id] ?? 0) >= 1) return false
    }
  }

  if (conditions.requireTaskComplete?.length) {
    for (const taskId of conditions.requireTaskComplete) {
      if (taskProgress[taskId] !== 'completed') return false
    }
  }

  return true
}

/**
 * 專門用於「進入對話自動觸發」：只尋找 condition-only 規則（無 keywords、無 itemTriggers、有 conditions），
 * 不需要玩家送出任何訊息。跳過 firstLogin / default 系統規則。
 */
export function findConditionOnlyRule(
  rules: CharacterRule[],
  ctx: ConditionContext,
): CharacterRule | null {
  const sorted = rules
    .map((rule, i) => ({ rule, i }))
    .sort((a, b) => (b.rule.priority ?? 0) - (a.rule.priority ?? 0) || a.i - b.i)

  for (const { rule } of sorted) {
    const hasConditions = !!rule.conditions && Object.keys(rule.conditions).length > 0
    const isConditionOnly =
      hasConditions &&
      rule.keywords.length === 0 &&
      (rule.itemTriggers ?? []).length === 0
    if (isConditionOnly && evaluateConditions(rule.conditions, ctx)) {
      return rule
    }
  }
  return null
}

export function findMatchingRule(
  rules: CharacterRule[],
  message: string,
  itemId: string | null | undefined,
  ctx: ConditionContext,
): CharacterRule | null {
  const lowerMsg = message.toLowerCase()

  const sorted = rules
    .map((rule, i) => ({ rule, i }))
    .sort((a, b) => (b.rule.priority ?? 0) - (a.rule.priority ?? 0) || a.i - b.i)

  for (const { rule } of sorted) {
    const keywordMatch = rule.keywords.some((k) => lowerMsg.includes(k.toLowerCase()))
    const itemTriggerMatch = itemId != null && (rule.itemTriggers ?? []).includes(itemId)
    // A rule with no keywords AND no itemTriggers AND at least one condition
    // is "condition-only": it matches any message and fires purely on conditions.
    // Rules with no keywords AND no conditions are skipped (backward compatible).
    const hasConditions = !!rule.conditions && Object.keys(rule.conditions).length > 0
    const isConditionOnly =
      hasConditions &&
      rule.keywords.length === 0 &&
      (rule.itemTriggers ?? []).length === 0
    if ((isConditionOnly || keywordMatch || itemTriggerMatch) && evaluateConditions(rule.conditions, ctx)) {
      return rule
    }
  }

  return null
}
