import type { ChatMessage } from '@/types/chat'

export interface Conversation {
  characterId: string
  messages: ChatMessage[]
  counters: Record<string, number>
}

interface GlobalStore {
  _conversations?: Map<string, Conversation>
}

const g = global as unknown as GlobalStore
export const conversations: Map<string, Conversation> =
  g._conversations || new Map<string, Conversation>()

if (!g._conversations) {
  g._conversations = conversations
}
