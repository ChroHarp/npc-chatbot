import { NextResponse } from 'next/server'
import { db } from '@/libs/firebase'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

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

  await setDoc(doc(db, 'teams', teamCode), {
    createdAt: serverTimestamp(),
    createdBy: uid,
    members: [uid],
    taskProgress: {},
  })

  return NextResponse.json({ teamCode })
}
