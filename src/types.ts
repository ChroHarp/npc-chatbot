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
  rules: Rule[]
}
