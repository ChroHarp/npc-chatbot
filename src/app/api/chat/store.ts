import type { ChatMessage } from '@/types/chat'

interface GlobalStore {
  _conversations?: Map<string, ChatMessage[]>
}

const g = global as unknown as GlobalStore
export const conversations: Map<string, ChatMessage[]> =
  g._conversations || new Map<string, ChatMessage[]>()

if (!g._conversations) {
  g._conversations = conversations
}
