export interface ResponseItem {
  type: 'text' | 'image'
  value: string | File
}

export interface Rule {
  keywords: string[]
  responses: ResponseItem[]
}

export interface CharacterDoc {
  name: string
  avatarUrl: string
  rules: Rule[]
}
