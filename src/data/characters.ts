import type { ResponseItem, CharacterDoc } from '@/types'

export interface CharacterRule {
  keywords: string[]
  responses: ResponseItem[]
}

export interface CharacterData {
  id: string
  avatarUrl?: string
  avatarX?: number
  avatarY?: number
  avatarScale?: number
  greeting: ResponseItem[]
  rules: CharacterRule[]
  defaultResponses: ResponseItem[]
}

export const characters: Record<string, CharacterData> = {
  default: {
    id: 'default',
    avatarUrl: '/next.svg',
    avatarX: 0,
    avatarY: 0,
    avatarScale: 1,
    greeting: [{ type: 'text', value: '你好，我是預設角色' }],
    rules: [
      { keywords: ['你好', 'hi'], responses: [{ type: 'text', value: '很高興見到你！' }] },
      { keywords: ['再見', 'bye'], responses: [{ type: 'text', value: '下次見！' }] },
    ],
    defaultResponses: [
      { type: 'text', value: '我還在學習，聽不太懂你的意思。' },
    ],
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

      const greeting: ResponseItem[] = first?.responses?.length
        ? (first.responses.map((res) => ({
            type: res.type as 'text' | 'image',
            value: res.value as string,
          })) as ResponseItem[])
        : [{ type: 'text', value: `你好，我是${data.name || 'NPC'}` }]

      const defaultResponses: ResponseItem[] = def?.responses?.length
        ? (def.responses.map((res) => ({
            type: res.type as 'text' | 'image',
            value: res.value as string,
          })) as ResponseItem[])
        : characters.default.defaultResponses

      return {
        id,
        avatarUrl: data.avatarUrl || characters.default.avatarUrl,
        avatarX: typeof data.avatarX === 'number' ? data.avatarX : characters.default.avatarX,
        avatarY: typeof data.avatarY === 'number' ? data.avatarY : characters.default.avatarY,
        avatarScale: typeof data.avatarScale === 'number' ? data.avatarScale : characters.default.avatarScale,
        greeting,
        rules: others.map((r) => ({
          keywords: r.keywords || [],
          responses:
            (r.responses?.map((res) => ({
              type: res.type as 'text' | 'image',
              value: res.value as string,
            })) as ResponseItem[]) || [],
        })),
        defaultResponses,
      }
    }
  } catch (err) {
    console.error('getCharacter failed', err)
  }
  return characters.default
}
