export interface ResponseItem {
  type: 'text' | 'image' | 'item'
  value: string | File
  scale?: number
  x?: number
  y?: number
}

export interface Rule {
  keywords: string[]
  responses: ResponseItem[]
  type?: 'firstLogin' | 'default'
}

export interface CharacterDoc {
  name: string
  avatarUrl: string
  avatarScale?: number
  avatarX?: number
  avatarY?: number
  /** Determines display order in admin list */
  order?: number
  rules: Rule[]
  tasks?: string[]
}

export interface TaskDoc {
  name: string
  description?: string
  createdAt?: import('firebase/firestore').Timestamp
}

export interface TeamDoc {
  createdAt: import('firebase/firestore').Timestamp
  createdBy: string
  members: string[]
  taskProgress: Record<string, 'locked' | 'active' | 'completed'>
  /** Shared conversations per character: characterId → conversationId */
  conversations?: Record<string, string>
  /** Team inventory: itemId → quantity */
  inventory?: Record<string, number>
  /** Firestore TTL field — document auto-deleted 48h after team creation */
  expireAt: import('firebase/firestore').Timestamp
}

export interface ItemDoc {
  name: string
  description?: string
  imageUrl?: string
  imageScale?: number
  imageX?: number
  imageY?: number
  category?: string
  stackable: boolean
  maxPerTeam?: number
  createdAt: import('firebase/firestore').Timestamp
  order?: number
}
