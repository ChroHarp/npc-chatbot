import { NextResponse } from 'next/server'
import { db } from '@/libs/firebase'
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

function randomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function POST(req: Request) {
  const { uid } = (await req.json()) as { uid?: string }
  if (!uid) return new NextResponse('Bad Request', { status: 400 })

  let teamCode = randomCode()
  for (let i = 0; i < 10; i++) {
    const snap = await getDoc(doc(db, 'teams', teamCode))
    if (!snap.exists()) break
    teamCode = randomCode()
  }

  // TTL: auto-delete after 48 hours via Firestore TTL policy on `expireAt`
  const expireAt = Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000))

  await setDoc(doc(db, 'teams', teamCode), {
    createdAt: serverTimestamp(),
    createdBy: uid,
    members: [uid],
    taskProgress: {},
    expireAt,
  })

  return NextResponse.json({ teamCode })
}
