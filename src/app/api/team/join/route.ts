import { NextResponse } from 'next/server'
import { db } from '@/libs/firebase'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'

export async function POST(req: Request) {
  const { teamCode, uid } = (await req.json()) as { teamCode?: string; uid?: string }
  if (!teamCode || !uid) return new NextResponse('Bad Request', { status: 400 })

  const snap = await getDoc(doc(db, 'teams', teamCode))
  if (!snap.exists()) return new NextResponse('Not Found', { status: 404 })

  await updateDoc(doc(db, 'teams', teamCode), { members: arrayUnion(uid) })
  return NextResponse.json({ ok: true })
}
