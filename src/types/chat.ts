export type MessageType = 'TEXT' | 'IMAGE' | 'YOUTUBE' | 'ITEM'
export interface ChatMessage {
  id: string
  role: 'user' | 'npc'
  type: MessageType
  content: string
  timestamp?: string
  avatarUrl?: string
  avatarX?: number
  avatarY?: number
  avatarScale?: number
  itemImageUrl?: string
  itemImageScale?: number
  itemImageX?: number
  itemImageY?: number
  typing?: boolean
}
