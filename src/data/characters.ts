export interface CharacterData {
  id: string
  avatarUrl?: string
  greeting: string
  rules: { keywords: string[]; response: string }[]
  defaultResponse: string
}

export const characters: Record<string, CharacterData> = {
  default: {
    id: 'default',
    avatarUrl: '/next.svg',
    greeting: '你好，我是預設角色',
    rules: [
      { keywords: ['你好', 'hi'], response: '很高興見到你！' },
      { keywords: ['再見', 'bye'], response: '下次見！' },
    ],
    defaultResponse: '我還在學習，聽不太懂你的意思。',
  },
}
