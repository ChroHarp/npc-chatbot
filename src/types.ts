export interface ResponseItem {
  type: 'text' | 'image'
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
