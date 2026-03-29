import { db } from '@/libs/firebase'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import type { ChatMessage } from '@/types/chat'

export async function createConversation(
  conversationId: string,
  characterId: string,
  teamCode: string | null = null,
  uid: string | null = null,
): Promise<void> {
  await setDoc(doc(db, 'conversations', conversationId), {
    characterId,
    teamCode,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getConversation(
  conversationId: string,
): Promise<{ characterId: string; teamCode: string | null; uid: string | null } | null> {
  const snap = await getDoc(doc(db, 'conversations', conversationId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    characterId: data.characterId as string,
    teamCode: (data.teamCode as string | null) ?? null,
    uid: (data.uid as string | null) ?? null,
  }
}

export async function addMessages(
  conversationId: string,
  messages: ChatMessage[],
): Promise<void> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  await Promise.all(
    messages.map((msg) =>
      setDoc(doc(messagesRef, msg.id), {
        role: msg.role,
        type: msg.type,
        content: msg.content,
        avatarUrl: msg.avatarUrl ?? null,
        avatarX: msg.avatarX ?? null,
        avatarY: msg.avatarY ?? null,
        avatarScale: msg.avatarScale ?? null,
        timestamp: serverTimestamp(),
      }),
    ),
  )
  await setDoc(
    doc(db, 'conversations', conversationId),
    { updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  const snap = await getDocs(query(messagesRef, orderBy('timestamp', 'asc')))
  return snap.docs.map((d) => {
    const data = d.data()
    const ts =
      data.timestamp instanceof Timestamp
        ? data.timestamp.toDate().toISOString()
        : new Date().toISOString()
    return {
      id: d.id,
      role: data.role as ChatMessage['role'],
      type: data.type as ChatMessage['type'],
      content: data.content as string,
      avatarUrl: data.avatarUrl ?? undefined,
      avatarX: data.avatarX ?? undefined,
      avatarY: data.avatarY ?? undefined,
      avatarScale: data.avatarScale ?? undefined,
      timestamp: ts,
    }
  })
}
