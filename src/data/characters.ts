export interface CharacterData {
  id: string
  avatarUrl?: string
  greeting: string
  rules: { keywords: string[]; response: string }[]
  defaultResponse: string
}

import type { CharacterDoc } from '@/types'

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

let cachedDb: import('firebase/firestore').Firestore | null = null

async function getDb() {
  if (cachedDb) return cachedDb
  const { initializeApp, getApps, getApp } = await import('firebase/app')
  const { getFirestore } = await import('firebase/firestore')

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  cachedDb = getFirestore(app)
  return cachedDb
}

export async function getCharacter(id: string): Promise<CharacterData> {
  if (id === 'default') return characters.default
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const db = await getDb()
    const snap = await getDoc(doc(db, 'characters', id))
    if (snap.exists()) {
      const data = snap.data() as CharacterDoc
      const first = (data.rules || []).find((r) => r.type === 'firstLogin')
      const def = (data.rules || []).find((r) => r.type === 'default')
      const others = (data.rules || []).filter(
        (r) => r.type !== 'firstLogin' && r.type !== 'default',
      )
      const greetValue = first?.responses?.[0]?.value
      const defValue = def?.responses?.[0]?.value
      return {
        id,
        avatarUrl: data.avatarUrl || characters.default.avatarUrl,
        greeting:
          typeof greetValue === 'string'
            ? greetValue
            : `你好，我是${data.name || 'NPC'}`,
        rules: others.map((r) => ({
          keywords: r.keywords || [],
          response:
            typeof r.responses?.[0]?.value === 'string'
              ? (r.responses[0].value as string)
              : '',
        })),
        defaultResponse:
          typeof defValue === 'string'
            ? defValue
            : characters.default.defaultResponse,
      }
    }
  } catch (err) {
    console.error('getCharacter failed', err)
  }
  return characters.default
}
